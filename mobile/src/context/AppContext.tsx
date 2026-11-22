import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Paquete, Rol, Screen } from '../domain/models';
import { demoPackages } from '../mocks/data';
import { settings } from '../config/env';

type NavEntry = { screen: Screen; paquete?: Paquete };
export interface AppState {
  screen: Screen; role: Rol; paquete: Paquete; isLoggedIn: boolean;
  perfilId: number;
  navigate: (screen: Screen, paquete?: Paquete) => void;
  back: () => void;
  changeRole: (role: Rol) => void;
  signInDemo: () => void;
  logout: () => void;
}
const Context = createContext<AppState | undefined>(undefined);
export function AppProvider({children}:{children: React.ReactNode}) {
  const [entries,setEntries] = useState<NavEntry[]>([{ screen: 'login' }]);
  const [role,setRole] = useState<Rol>('comprador');
  const [isLoggedIn,setLoggedIn] = useState(false);
  const current = entries[entries.length - 1];
  const navigate = useCallback((screen: Screen, paquete?: Paquete) => {
    setEntries(prev => [...prev, { screen, paquete: paquete || prev[prev.length-1]?.paquete }]);
  },[]);
  const back = useCallback(() => setEntries(prev => prev.length > 1 ? prev.slice(0,-1) : [{screen:'inicio'}]),[]);
  const changeRole = useCallback((next: Rol) => setRole(next),[]);
  const signInDemo = useCallback(() => { setLoggedIn(true); setEntries([{screen:'inicio'}]); },[]);
  const logout = useCallback(() => { setLoggedIn(false); setEntries([{screen:'login'}]); },[]);
  const perfilId = role === 'comprador' ? settings.compradorId : settings.comercianteId;
  const value = useMemo<AppState>(() => ({
    screen:current.screen, role, paquete:current.paquete || demoPackages[0], isLoggedIn,perfilId,
    navigate, back, changeRole,signInDemo,logout,
  }),[current,role,isLoggedIn,perfilId,navigate,back,changeRole,signInDemo,logout]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp(): AppState {
  const context=useContext(Context); if(!context) throw new Error('Falta AppProvider');return context;
}
