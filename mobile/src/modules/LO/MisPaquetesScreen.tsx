import React, { useMemo, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import { useApp } from '../../context/AppContext';
import { Txt, Header, ScreenBody, Chip, DemoFlag, ResourceGate, Empty } from '../../components/Primitives';
import { colors } from '../../config/theme';
import { PackageCard } from '../AL/PackageCard';
const filters=[{label:'Todos',estado:''},{label:'En almacén',estado:'ALMACENADO'},{label:'Listos para recoger',estado:'PENDIENTE_RETIRO'},{label:'Entregados',estado:'ENTREGADO'},{label:'Observados',estado:'OBSERVADO'}];
export function MisPaquetesScreen(){
 const {role,perfilId,navigate}=useApp();
 const [estado,setEstado]=useState(''),[buscar,setBuscar]=useState('');
 const {data,loading,error,reload}=useRemote(()=>repository.listarPaquetes(role,perfilId,estado||undefined),[role,perfilId,estado]);
 const view=useMemo(()=> (data?.paquetes||[]).filter(p=>`${p.codigo_interno} ${p.numero_seguimiento} ${p.descripcion}`.toLowerCase().includes(buscar.trim().toLowerCase())),[data,buscar]);
 return <><Header title="Mis paquetes" subtitle={`Consulta tus paquetes como ${role}`}/><ScreenBody><DemoFlag/>
  <View style={styles.search}><Feather name="search" size={17} color={colors.muted}/><TextInput placeholder="Buscar código, seguimiento o descripción" value={buscar} onChangeText={setBuscar} style={styles.input} placeholderTextColor={colors.muted}/></View>
  <View style={styles.filters}>{filters.map(f=><Chip key={f.label} label={f.label} active={estado===f.estado} onPress={()=>setEstado(f.estado)}/>)}</View>
  <ResourceGate loading={loading} error={error} onRetry={reload}>
   <Txt size={12} muted>{view.length} paquete(s) encontrado(s)</Txt>
   {view.length ? view.map(p=><PackageCard key={p.id} paquete={p} onPress={()=>navigate(p.estado==='OBSERVADO'?'observado':'detalle',p)}/>) : <Empty title="No se encontraron paquetes" description="Prueba con otro filtro o revisa si tienes paquetes asignados."/>}
  </ResourceGate>
 </ScreenBody></>;
}
const styles=StyleSheet.create({search:{backgroundColor:'#fff',flexDirection:'row',alignItems:'center',borderRadius:13,borderWidth:1,borderColor:colors.line,paddingHorizontal:12},input:{flex:1,padding:11,fontSize:11,color:colors.ink},filters:{flexDirection:'row',flexWrap:'wrap',gap:6}});
