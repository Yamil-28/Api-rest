import React from 'react';
import { View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { demoProfile } from '../../mocks/data';
import { settings } from '../../config/env';
import { Card, Txt, Header, ScreenBody, InfoRow, Button, DemoFlag } from '../../components/Primitives';
export function PerfilScreen(){const {role,changeRole,logout,perfilId,navigate}=useApp();return <><Header title="Mi perfil" subtitle="Cuenta y preferencias"/><ScreenBody><DemoFlag/>
 <Card><Txt bold size={18}>{settings.dataSource==='mock'?demoProfile.nombre:'Perfil de usuario'}</Txt><InfoRow label="Rol activo" value={role==='comprador'?'Comprador':'Comerciante'}/><InfoRow label="ID perfil" value={String(perfilId)}/><InfoRow label="Correo (demo)" value={settings.dataSource==='mock'?demoProfile.correo:'Sin sesión integrada'}/></Card>
 <Card><Txt size={15} bold style={{marginBottom:10}}>Cambiar rol</Txt><View style={{gap:9}}><Button label="Usar vista comprador" onPress={()=>changeRole('comprador')} variant={role==='comprador'?'amber':'outline'}/><Button label="Usar vista comerciante" onPress={()=>changeRole('comerciante')} variant={role==='comerciante'?'amber':'outline'}/></View></Card>
 <Button label="Ver historial de entregas" variant="outline" onPress={()=>navigate('historial')}/><Button label="Cerrar sesión de demostración" variant="outline" onPress={logout}/>
 <Txt muted size={11} style={{lineHeight:17}}>Los identificadores configurados en Expo son IDs de perfil para pruebas. La versión real debe obtenerlos del usuario JWT autenticado en el backend.</Txt>
 </ScreenBody></>}
