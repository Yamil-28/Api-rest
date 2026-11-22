import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import { colors } from '../../config/theme';
import { Txt, Card, Hero, Button, DemoFlag, ResourceGate, ScreenBody } from '../../components/Primitives';
import { pendiente } from '../../domain/format';
export function HomeScreen(){
 const {role,perfilId,changeRole,navigate}=useApp();
 const {data,loading,error,reload}=useRemote(()=>repository.listarPaquetes(role,perfilId),[role,perfilId]);
 const pkg=data?.paquetes||[];
 const pending=pkg.filter(p=>pendiente(p));
 const ready=pkg.filter(p=>p.estado==='PENDIENTE_RETIRO');
 const observed=pkg.filter(p=>p.estado==='OBSERVADO');
 return <>
  <View style={styles.brand}><View style={styles.logo}><Feather name="package" size={21} color="#342200"/></View><View style={{flex:1}}><Txt bold size={19}>Cofre Express</Txt><Txt muted size={10}>Compras y entregas en una sola app</Txt></View><Pressable onPress={()=>navigate('avisos')} style={styles.bell}><Feather name="bell" size={18}/></Pressable></View>
  <ScreenBody><DemoFlag/>
   <Hero><Txt size={10} bold style={{letterSpacing:1.4,color:'#865600'}}>UNA SOLA CUENTA · DOS ROLES</Txt><Txt size={25} bold style={{marginTop:8,lineHeight:27}}>TU CENTRO DE GESTIÓN INTEGRAL</Txt><Txt size={12} style={{marginTop:8,lineHeight:18,color:'#62431D'}}>Administra todas tus compras y envíos desde un solo perfil unificado. Ahorra tiempo y simplifica la logística de tus paquetes.</Txt>
    <View style={{flexDirection:'row',gap:8,marginTop:14}}><Button label="Vista comprador" onPress={()=>changeRole('comprador')} variant={role==='comprador'?'primary':'secondary'} style={{flex:1,paddingHorizontal:5}}/><Button label="Vista comerciante" onPress={()=>changeRole('comerciante')} variant={role==='comerciante'?'primary':'secondary'} style={{flex:1,paddingHorizontal:5}}/></View>
    <ResourceGate loading={loading} error={error} onRetry={reload}><View style={styles.stats}>{[{n:pkg.length,l:'Mis compras'},{n:pending.length,l:'Mis envíos'},{n:observed.length,l:'Por revisar'}].map((v,i)=><View key={i} style={styles.stat}><Txt bold size={24}>{v.n}</Txt><Txt size={10}>{v.l}</Txt></View>)}</View></ResourceGate>
   </Hero>
   <Card style={styles.notice}><Txt bold size={12} style={{color:colors.deepAmber}}>El pago del locker se define al registrar el paquete</Txt><Txt size={11} style={{lineHeight:17,color:'#96621C',marginTop:3}}>Cada paquete muestra claramente si debe pagar el comerciante o el comprador.</Txt></Card>
   <Txt bold size={17} style={{marginTop:2}}>Resumen rápido</Txt>
   <View style={{flexDirection:'row',gap:9}}><Card style={{flex:1,minHeight:95}} onPress={()=>navigate('paquetes')}><Txt size={11} muted>Mis paquetes</Txt><Txt bold size={20} style={{marginTop:10}}>{ready.length} por recoger</Txt></Card><Card style={{flex:1,minHeight:95}} onPress={()=>navigate('avisos')}><Txt size={11} muted>Mis envíos</Txt><Txt bold size={20} style={{marginTop:10}}>{observed.length} con alerta</Txt></Card></View>
   <Card style={styles.notice}><Txt bold size={12} style={{color:colors.deepAmber}}>Tarifa de Servicio Semanal</Txt><Txt size={11} style={{lineHeight:17,color:'#96621C',marginTop:3}}>Al utilizar el servicio de recojo y entrega, se establece una tarifa operativa semanal de 2 Bs.</Txt></Card>
  </ScreenBody>
 </>;
}
const styles=StyleSheet.create({brand:{backgroundColor:'#fff',padding:15,minHeight:74,flexDirection:'row',gap:10,alignItems:'center',borderBottomWidth:1,borderColor:colors.line},logo:{width:41,height:41,borderRadius:14,backgroundColor:colors.amber,alignItems:'center',justifyContent:'center'},bell:{width:35,height:35,borderWidth:1,borderColor:colors.line,borderRadius:12,alignItems:'center',justifyContent:'center'},stats:{flexDirection:'row',gap:8,marginTop:15},stat:{flex:1,paddingVertical:12,paddingHorizontal:9,backgroundColor:'rgba(255,255,255,.44)',borderRadius:14,gap:4},notice:{borderColor:'#F2D48F',backgroundColor:'#FFF3D7'}});
