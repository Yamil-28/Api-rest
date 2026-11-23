import React from 'react';
import { View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { demoProfile } from '../../mocks/data';
import { settings } from '../../config/env';
import { Card, Txt, Header, ScreenBody, InfoRow, Button, DemoFlag } from '../../components/Primitives';
export function PerfilScreen(){const {role,changeRole,logout,perfilId,navigate,userEmail,hasBuyerRole,hasMerchantRole,staff,revisor}=useApp();return <><Header title="Mi perfil" subtitle="Cuenta y preferencias"/><ScreenBody><DemoFlag/>
 <Card><Txt bold size={18}>{settings.dataSource==='mock'?demoProfile.nombre:'Perfil de usuario'}</Txt><InfoRow label="Rol activo" value={settings.dataSource==='api'&&!hasBuyerRole&&!hasMerchantRole?(revisor?'Revisor de pagos':'Personal autorizado'):(role==='comprador'?'Comprador':'Comerciante')}/><InfoRow label="ID perfil" value={perfilId?String(perfilId):'No aplica'}/><InfoRow label="Correo (demo)" value={settings.dataSource==='mock'?demoProfile.correo:userEmail}/></Card>
 <Card><Txt size={15} bold style={{marginBottom:10}}>Cambiar rol</Txt><View style={{gap:9}}>{(settings.dataSource==='mock'||hasBuyerRole)&&<Button label="Usar vista comprador" onPress={()=>changeRole('comprador')} variant={role==='comprador'?'amber':'outline'}/>} {(settings.dataSource==='mock'||hasMerchantRole)&&<Button label="Usar vista comerciante" onPress={()=>changeRole('comerciante')} variant={role==='comerciante'?'amber':'outline'}/>} </View></Card>
 {revisor&&<Button label="Revisar comprobantes bancarios" variant="amber" onPress={()=>navigate('revisar-pagos')}/>}
 {staff&&<Button label="Validar QR de recojo (personal)" variant="amber" onPress={()=>navigate('validar')}/>}<Button label="Ver historial de entregas" variant="outline" onPress={()=>navigate('historial')}/><Button label="Cerrar sesión" variant="outline" onPress={logout}/>
 <Txt muted size={11} style={{lineHeight:17}}>{settings.dataSource==='mock'?'IDs de ejemplo.':'Los roles y los IDs los devuelve el backend luego de validar tu JWT.'}</Txt>
 </ScreenBody></>}
