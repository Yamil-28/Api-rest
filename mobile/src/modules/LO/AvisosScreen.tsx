import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import { useApp } from '../../context/AppContext';
import { Card, Txt, Header, ScreenBody, Chip, DemoFlag, ResourceGate, Empty, Status, IconTile } from '../../components/Primitives';
import { fechaCorta } from '../../domain/format';
export function AvisosScreen(){const {role,perfilId,navigate}=useApp();
 const [tipo,setTipo]=useState('Todos');
 const {data,loading,error,reload}=useRemote(()=>repository.listarAvisos(role,perfilId),[role,perfilId]);
 const displayed=useMemo(()=> (data?.avisos||[]).filter(a=>tipo==='Todos'||(tipo==='Alertas'?a.estado==='ALERTA':a.estado==='POSITIVO')),[data,tipo]);
 return <><Header title="Avisos" subtitle="Movimientos y alertas de tus paquetes"/><ScreenBody><DemoFlag/>
 <View style={{flexDirection:'row',gap:6}}>{['Todos','Alertas','Positivos'].map(label=><Chip key={label} label={label} active={tipo===label} onPress={()=>setTipo(label)}/>)}</View>
 <ResourceGate loading={loading} error={error} onRetry={reload}>
  {displayed.length===0?<Empty title="No hay avisos" description="Los avisos aparecerán cuando cambie el estado de tus paquetes."/>:displayed.map(a=><Card key={a.id} onPress={()=>{if(a.paqueteId)navigate('paquetes')}}><View style={styles.row}><IconTile name={a.estado==='ALERTA'?'alert-triangle':a.estado==='POSITIVO'?'check-circle':'bell'} color={a.estado==='ALERTA'?'#B75048':undefined}/><View style={{flex:1,gap:5}}><Txt bold size={13}>{a.titulo}</Txt><Txt muted size={11} style={{lineHeight:17}}>{a.descripcion}</Txt><Txt size={10} muted>{a.fecha?fechaCorta(a.fecha):'Actualización del estado actual'}</Txt></View><Status text={a.estado==='ALERTA'?'Atención':a.estado==='POSITIVO'?'Actualizado':'Aviso'} tone={a.estado==='ALERTA'?'red':a.estado==='POSITIVO'?'green':'amber'}/></View></Card>)}
 </ResourceGate>
 <Txt size={10} muted style={{lineHeight:16}}>La versión API actual deriva los avisos del estado de los paquetes. Para historial y «leído/no leído» el backend necesita la tabla notificaciones.</Txt>
 </ScreenBody></>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'flex-start',gap:10}});
