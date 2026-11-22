import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../../context/AppContext';
import { settings } from '../../config/env';
import { emitirQRRecojo } from '../../api/HttpRepository';
import { Card, Txt, Header, ScreenBody, Status, InfoRow, Button, DemoFlag } from '../../components/Primitives';
import { codigoPaquete } from '../../domain/format';
import { colors } from '../../config/theme';
export function CodigoRecojoScreen(){const {paquete:p,back}=useApp();
 const [live,setLive]=useState<{codigo:string;qr_texto:string;expira:string}|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{if(settings.dataSource!=='api')return;let active=true;setLive(null);setError('');void emitirQRRecojo(p.id).then(v=>{if(active)setLive(v);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'No disponible');});return ()=>{active=false;};},[p.id]);
 const code=settings.dataSource==='mock'?(p.codigo_recojo||codigoPaquete(p)):(live?.codigo||'');
 const qrValue=settings.dataSource==='mock'?`COFRE-DEMO|PAQUETE:${p.id}|CODIGO:${code}`:(live?.qr_texto||'');
 return <><Header title="Código de recojo" subtitle="Presenta este código cuando retires tu paquete" back={back}/><ScreenBody><DemoFlag/>
 <View style={{alignItems:'center',gap:8,paddingVertical:10}}><Status text="Paquete en proceso de recojo" tone="green"/><Txt bold size={16} style={{marginTop:6}}>{code||'Esperando autorización...'}</Txt><Txt muted size={11}>Identificador de retiro</Txt>
  <View style={styles.qr}>{qrValue?<QRCode size={195} value={qrValue} color={colors.orange} backgroundColor="#FFFFFF"/>:<Txt muted>{error||'Obteniendo código válido...'}</Txt>}</View></View>
 <Card><InfoRow label="Rol actual" value="Comprador / Comerciante"/><InfoRow label="Código de paquete" value={codigoPaquete(p)}/><InfoRow label="Punto de recojo" value={p.sucursal||'Por confirmar'}/><InfoRow label="Horario" value="Consultar en sucursal"/><InfoRow label="Costo" value={typeof p.monto==='number'?`Bs ${p.monto}`:'Por confirmar'}/></Card>
 {settings.dataSource==='mock'&&<Button label="Compartir código" onPress={()=>{void Share.share({message:`Cofre Express: ${code}`});}}/>}{settings.dataSource==='mock'&&<Button label="Copiar código" variant="outline" onPress={()=>{void Clipboard.setStringAsync(code).then(()=>Alert.alert('Copiado','Código copiado al portapapeles'));}}/>}
 <Txt muted size={10} style={{textAlign:'center',lineHeight:16}}>{settings.dataSource==='mock'?'QR de demostración; no habilita retiro ni apertura.':'QR de un solo uso. Vence en 15 minutos y el empleado debe validarlo contra la API. No abre un locker físico por sí mismo.'}</Txt>
 </ScreenBody></>;
}
const styles=StyleSheet.create({qr:{padding:21,backgroundColor:'white',borderRadius:20,borderWidth:1,borderColor:colors.line,marginVertical:12,alignItems:'center',justifyContent:'center'}});
