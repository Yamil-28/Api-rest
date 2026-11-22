import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Txt, Header, ScreenBody, InfoRow, Status, Button, DemoFlag } from '../../components/Primitives';
import { codigoPaquete, etiquetaEstado, fechaCorta } from '../../domain/format';
import { colors } from '../../config/theme';
const stages=['RECIBIDO','ALMACENADO','PENDIENTE_RETIRO','ENTREGADO'];
export function DetallePaqueteScreen(){
 const {paquete:p,back,navigate}=useApp();
 const stageIndex=stages.indexOf(p.estado);
 return <><Header title="Detalle del paquete" subtitle="Información y seguimiento" back={back}/><ScreenBody><DemoFlag/>
  <Card><Txt size={10} muted>N.º de paquete</Txt><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8,gap:8,alignItems:'center'}}><Txt size={18} bold style={{flex:1}}>{p.descripcion}</Txt><Status text={etiquetaEstado(p.estado)} tone={p.estado==='ENTREGADO'?'green':p.estado==='OBSERVADO'?'red':'amber'}/></View>
   <InfoRow label="Código interno" value={codigoPaquete(p)}/><InfoRow label="Seguimiento" value={p.numero_seguimiento||'Sin número'}/><InfoRow label="Comprador" value={`Perfil ${p.comprador_id}`}/><InfoRow label="Comerciante" value={`Perfil ${p.comerciante_id}`}/><InfoRow label="Estado" value={etiquetaEstado(p.estado)}/><InfoRow label="Recibido" value={fechaCorta(p.fecha_recepcion)}/>
   {p.sucursal?<InfoRow label="Sucursal" value={p.sucursal}/>:null}
   {typeof p.monto==='number'?<InfoRow label="Costo de locker" value={`Bs ${p.monto}`}/>:null}
  </Card>
  <Card><Txt bold size={15}>Seguimiento</Txt><Txt size={11} muted style={{marginBottom:12}}>Etapas del paquete</Txt>
   {stages.map((stage,i)=>{const complete=stageIndex>=i;return <View key={stage} style={styles.stage}><View style={[styles.dot,{backgroundColor:complete?colors.green:colors.line}]} /><Txt size={12} bold={complete} style={{color:complete?colors.ink:colors.muted}}>{etiquetaEstado(stage)}</Txt><Txt muted size={10} style={{marginLeft:'auto'}}>{complete?'Completado':'Pendiente'}</Txt></View>})}
   {p.estado==='OBSERVADO'?<Txt size={12} style={{color:colors.red,marginTop:10}}>El paquete requiere revisión. Consulta los detalles observados.</Txt>:null}
  </Card>
  {p.estado==='OBSERVADO'?<Button label="Ver detalle observado" onPress={()=>navigate('observado',p)}/>:p.estado!=='ENTREGADO'?<Button label="Ver código de recojo" onPress={()=>navigate('codigo',p)}/>:<Button label="Ver historial de entrega" onPress={()=>navigate('historial',p)}/>}
 </ScreenBody></>;
}
const styles=StyleSheet.create({stage:{height:44,flexDirection:'row',alignItems:'center',gap:11},dot:{width:13,height:13,borderRadius:7}});
