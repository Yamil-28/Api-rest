import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import { Card, Txt, Header, ScreenBody, Chip, PillInfo, DemoFlag, ResourceGate, Empty, IconTile, Status } from '../../components/Primitives';
import { colors } from '../../config/theme';
import type { EstadoPago } from '../../domain/models';
export function PagosScreen(){const {perfilId}=useApp();
 const [estado,setEstado]=useState<'TODOS'|EstadoPago>('TODOS');
 const {data,loading,error,reload}=useRemote(()=>repository.listarPagos(perfilId),[perfilId]);
 const filtered=useMemo(()=> (data||[]).filter(x=>estado==='TODOS'||x.estado===estado),[data,estado]);
 const total=(data||[]).reduce((s,p)=>s+p.monto,0), pending=(data||[]).filter(p=>p.estado==='PENDIENTE');
 return <><Header title="Pagos del locker" subtitle="Consulta quién debe pagar por cada paquete"/><ScreenBody><DemoFlag/>
  <ResourceGate loading={loading} error={error} onRetry={reload}>
   <View style={{flexDirection:'row',gap:8}}><PillInfo label="Total asociado" value={`Bs ${total}`}/><PillInfo label="Pendientes" value={`${pending.length}`}/><PillInfo label="Completados" value={`${(data||[]).length-pending.length}`}/></View>
   <View style={styles.filters}>{[{id:'TODOS',t:'Todos'},{id:'PENDIENTE',t:'Pagos pendientes'},{id:'PAGADO',t:'Pagados'}].map(f=><Chip key={f.id} label={f.t} active={estado===f.id} onPress={()=>setEstado(f.id as 'TODOS'|EstadoPago)}/>)}</View>
   {filtered.length===0?<Empty title="No hay pagos" description="No existen registros para el filtro elegido."/>:filtered.map(p=><Card key={p.id}><View style={styles.row}><IconTile name="credit-card"/><View style={{flex:1}}><Txt size={12} bold numberOfLines={2}>{p.titulo}</Txt><Txt size={10} muted style={{marginTop:4}}>Debe pagar: {p.pagador==='comerciante'?'Comerciante':'Comprador'}</Txt></View><Txt size={16} bold>Bs {p.monto}</Txt></View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12}}><Status text={p.estado==='PAGADO'?'Sin deuda':'Deuda por comprobar'} tone={p.estado==='PAGADO'?'green':'amber'}/><Feather name="check-circle" size={15} color={p.estado==='PAGADO'?colors.green:colors.muted}/></View></Card>)}
  </ResourceGate>
 </ScreenBody></>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:8},filters:{flexDirection:'row',gap:7,flexWrap:'wrap'}});
