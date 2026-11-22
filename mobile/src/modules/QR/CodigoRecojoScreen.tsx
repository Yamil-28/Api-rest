import React from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../../context/AppContext';
import { Card, Txt, Header, ScreenBody, Status, InfoRow, Button, DemoFlag } from '../../components/Primitives';
import { codigoPaquete } from '../../domain/format';
import { colors } from '../../config/theme';
export function CodigoRecojoScreen(){const {paquete:p,back}=useApp();
 const code=p.codigo_recojo||codigoPaquete(p);
 return <><Header title="Código de recojo" subtitle="Presenta este código cuando retires tu paquete" back={back}/><ScreenBody><DemoFlag/>
 <View style={{alignItems:'center',gap:8,paddingVertical:10}}><Status text="Paquete en proceso de recojo" tone="green"/><Txt bold size={23} style={{marginTop:6}}>{code}</Txt><Txt muted size={11}>Identificador de retiro</Txt>
  <View style={styles.qr}><QRCode size={195} value={`COFRE-EXPRESS|PAQUETE:${p.id}|CODIGO:${code}`} color={colors.orange} backgroundColor="#FFFFFF"/></View></View>
 <Card><InfoRow label="Rol actual" value="Comprador / Comerciante"/><InfoRow label="Código de paquete" value={codigoPaquete(p)}/><InfoRow label="Punto de recojo" value={p.sucursal||'Por confirmar'}/><InfoRow label="Horario" value="Consultar en sucursal"/><InfoRow label="Costo" value={typeof p.monto==='number'?`Bs ${p.monto}`:'Por confirmar'}/></Card>
 <Button label="Compartir código" onPress={()=>{void Share.share({message:`Cofre Express: ${code}`});}}/><Button label="Copiar código" variant="outline" onPress={()=>{void Clipboard.setStringAsync(code).then(()=>Alert.alert('Copiado','Código copiado al portapapeles'));}}/>
 <Txt muted size={10} style={{textAlign:'center',lineHeight:16}}>QR de demostración visual. El retiro real necesita validar el código en el backend, su vigencia y su titular. No habilita apertura de lockers.</Txt>
 </ScreenBody></>;
}
const styles=StyleSheet.create({qr:{padding:21,backgroundColor:'white',borderRadius:20,borderWidth:1,borderColor:colors.line,marginVertical:12,alignItems:'center',justifyContent:'center'}});
