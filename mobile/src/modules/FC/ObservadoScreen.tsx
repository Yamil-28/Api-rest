import React from 'react';
import { View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { colors } from '../../config/theme';
import { Card, Txt, Header, ScreenBody, Status, InfoRow, Button, DemoFlag } from '../../components/Primitives';
import { codigoPaquete, fechaCorta } from '../../domain/format';
export function ObservadoScreen(){const {paquete:p,back,navigate}=useApp();return <><Header title="Detalle del paquete" subtitle="Información del envío" back={back}/><ScreenBody><DemoFlag/>
 <Card><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}><Txt bold size={18}>{p.descripcion}</Txt><Status text="Requiere revisión" tone="red"/></View>
 <InfoRow label="Código del paquete" value={codigoPaquete(p)}/><InfoRow label="Número de seguimiento" value={p.numero_seguimiento}/><InfoRow label="Fecha de recepción" value={fechaCorta(p.fecha_recepcion)}/><InfoRow label="Estado" value="OBSERVADO"/>
 <Txt size={12} bold style={{marginTop:12}}>Observación</Txt><Txt size={12} style={{color:colors.red,marginTop:5,lineHeight:19}}>Este paquete presenta una observación. Contacta a la sucursal o al encargado para obtener más detalles y regularizar su entrega.</Txt></Card>
 <Card><Txt bold size={14}>Ubicación</Txt><InfoRow label="Sucursal" value={p.sucursal||'No asignada'}/><InfoRow label="Locker" value="Pendiente de confirmación"/></Card>
 <Button label="Regresar a mis paquetes" onPress={()=>navigate('paquetes')}/>
 </ScreenBody></>}
