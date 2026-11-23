import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Paquete, Rol, Screen } from '../domain/models';
import { demoPackages } from '../mocks/data';
import { settings } from '../config/env';
import { setUserAccessToken } from '../api';
import { supabaseAuth } from '../auth/supabase';

type NavEntry = { screen: Screen; paquete?: Paquete };
interface Identity { compradorId:number|null; comercianteId:number|null; nombre:string; email:string; staff:boolean; revisor:boolean; }
export interface AppState {
  screen: Screen; role: Rol; paquete: Paquete; isLoggedIn: boolean; perfilId:number;
  userEmail:string; hasBuyerRole:boolean; hasMerchantRole:boolean; staff:boolean; revisor:boolean;
  navigate:(screen:Screen,paquete?:Paquete)=>void; back:()=>void; changeRole:(role:Rol)=>void;
  signInDemo:()=>void; signInReal:(email:string,password:string)=>Promise<void>; logout:()=>void;
}
const Context=createContext<AppState|undefined>(undefined);
async function fetchIdentity(token: string): Promise<Identity> {
  if (!settings.apiBaseUrl) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en la compilacion del APK.');
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const getMe = () => fetch(`${settings.apiBaseUrl}/cofre/me`, { headers });
  let resp = await getMe();
  if (resp.status === 403) {
    // Solo aprovisionamos al usuario nuevo cuando el backend confirma que NO esta vinculado.
    const body = await resp.clone().json().catch(() => ({})) as {message?: string};
    if (body.message === 'Cuenta no vinculada al perfil de Cofre Express') {
      const created = await fetch(`${settings.apiBaseUrl}/cofre/registro`, {
        method: 'POST', headers,
      });
      if (!created.ok) {
        const detail = await created.json().catch(() => ({})) as {message?: string};
        throw new Error(detail.message || `Registro de perfil fallido (HTTP ${created.status}).`);
      }
      resp = await getMe();
    }
  }
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({})) as {message?: string};
    throw new Error(error.message || `No fue posible verificar la cuenta (HTTP ${resp.status}).`);
  }
  return await resp.json() as Identity;
}
export function AppProvider({children}:{children:React.ReactNode}) {
  const [entries,setEntries]=useState<NavEntry[]>([{screen:'login'}]);
  const [role,setRole]=useState<Rol>('comprador');
  const [isLoggedIn,setLoggedIn]=useState(false);
  const [identity,setIdentity]=useState<Identity|null>(null);
  const current=entries[entries.length-1];
  useEffect(()=>{
    if(settings.dataSource!=='api' || !supabaseAuth) return;
    let alive=true;
    void supabaseAuth.auth.getSession().then(async ({data})=>{
      const token=data.session?.access_token;
      if(!token || !alive) return;
      try {const me=await fetchIdentity(token);if(!alive)return;setIdentity(me);setRole(me.compradorId?'comprador':'comerciante');setUserAccessToken(token);setLoggedIn(true);setEntries([{screen:me.revisor&&!me.compradorId&&!me.comercianteId?'revisar-pagos':me.staff&&!me.compradorId&&!me.comercianteId?'validar':'inicio'}]);}
      catch {await supabaseAuth?.auth.signOut();setUserAccessToken();}
    });
    const {data:{subscription}}=supabaseAuth.auth.onAuthStateChange((_event,session)=>setUserAccessToken(session?.access_token));
    return ()=>{alive=false;subscription.unsubscribe();};
  },[]);
  const navigate=useCallback((screen:Screen,paquete?:Paquete)=>setEntries(old=>[...old,{screen,paquete:paquete||old[old.length-1]?.paquete}]),[]);
  const back=useCallback(()=>setEntries(old=>old.length>1?old.slice(0,-1):[{screen:'inicio'}]),[]);
  const changeRole=useCallback((next:Rol)=>{
    if(settings.dataSource==='api' && identity && !(next==='comprador'?identity.compradorId:identity.comercianteId)) return;
    setRole(next);
  },[identity]);
  const signInDemo=useCallback(()=>{if(settings.dataSource!=='mock')return;setLoggedIn(true);setEntries([{screen:'inicio'}]);},[]);
  const signInReal=useCallback(async (email:string,password:string)=>{
    if(settings.dataSource!=='api'||!supabaseAuth)throw new Error('Configura Supabase Auth en .env para habilitar el inicio real.');
    const {data,error}=await supabaseAuth.auth.signInWithPassword({email:email.trim(),password});
    if(error||!data.session) throw new Error(error?.message||'No se pudo iniciar sesion');
    try {const me=await fetchIdentity(data.session.access_token);setIdentity(me);setRole(me.compradorId?'comprador':'comerciante');setUserAccessToken(data.session.access_token);setLoggedIn(true);setEntries([{screen:me.revisor&&!me.compradorId&&!me.comercianteId?'revisar-pagos':me.staff&&!me.compradorId&&!me.comercianteId?'validar':'inicio'}]);}
    catch(e){await supabaseAuth.auth.signOut();setUserAccessToken();throw e;}
  },[]);
  const logout=useCallback(()=>{setLoggedIn(false);setEntries([{screen:'login'}]);setIdentity(null);setUserAccessToken();if(settings.dataSource==='api')void supabaseAuth?.auth.signOut();},[]);
  const perfilId=settings.dataSource==='mock'? (role==='comprador'?settings.compradorId:settings.comercianteId):(role==='comprador'?identity?.compradorId:identity?.comercianteId)||0;
  const value=useMemo<AppState>(()=>({screen:current.screen,role,paquete:current.paquete||demoPackages[0],isLoggedIn,perfilId,
    userEmail:identity?.email||'',hasBuyerRole:!!identity?.compradorId,hasMerchantRole:!!identity?.comercianteId,staff:!!identity?.staff,revisor:!!identity?.revisor,
    navigate,back,changeRole,signInDemo,signInReal,logout}),[current,role,isLoggedIn,perfilId,identity,navigate,back,changeRole,signInDemo,signInReal,logout]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp():AppState {const app=useContext(Context);if(!app)throw new Error('Falta AppProvider');return app;}
