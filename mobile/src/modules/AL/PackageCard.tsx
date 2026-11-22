import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Txt, IconTile, Status } from '../../components/Primitives';
import { codigoPaquete, etiquetaEstado, fechaCorta } from '../../domain/format';
import type { Paquete } from '../../domain/models';
import { colors } from '../../config/theme';
export function PackageCard({paquete,onPress}: {paquete:Paquete,onPress:()=>void}){
 const tone=paquete.estado==='ENTREGADO'?'green':paquete.estado==='OBSERVADO'?'red':paquete.estado==='PENDIENTE_RETIRO'?'blue':'amber';
 return <Card onPress={onPress} style={{padding:12}}><View style={styles.row}><IconTile name="package"/><View style={{flex:1}}><Txt size={12} bold numberOfLines={1}>{codigoPaquete(paquete)} · {paquete.descripcion}</Txt><Txt muted size={10} style={{marginTop:5}}>{paquete.numero_seguimiento || 'Sin número de seguimiento'}</Txt></View><Feather name="chevron-right" size={16} color={colors.muted}/></View><View style={[styles.row,{justifyContent:'space-between',marginTop:11}]}><Status text={etiquetaEstado(paquete.estado)} tone={tone}/><Txt size={10} muted>{fechaCorta(paquete.fecha_recepcion)}</Txt></View></Card>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:9}});
