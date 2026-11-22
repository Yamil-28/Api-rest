import React, { useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Txt } from '../../components/Primitives';
import { colors } from '../../config/theme';
import { settings } from '../../config/env';
import { enviarComprobante } from '../../api/HttpRepository';
import type { Pago } from '../../domain/models';

/** QR bancario del negocio; NO es el QR de retiro de paquetes. */
const qrBancario = require('../../../assets/qr_pago_bancario.png');
const MAX_BYTES = 5 * 1024 * 1024;

export function QRBancarioManual({ pago, onReportado }: { pago: Pago; onReportado: () => void }) {
  const [referencia, setReferencia] = useState('');
  const [archivo, setArchivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enRevision, setEnRevision] = useState(false);

  const seleccionar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (!selected) return;
      if (selected.size !== undefined && (selected.size < 32 || selected.size > MAX_BYTES)) {
        Alert.alert('Archivo demasiado grande', 'Selecciona una imagen JPG, PNG, WebP o PDF de hasta 5 MB.');
        return;
      }
      if (!/\.(jpe?g|png|webp|pdf)$/i.test(selected.name)) {
        Alert.alert('Formato no admitido', 'Solo se permiten JPG, PNG, WebP y PDF.');
        return;
      }
      setArchivo(selected);
    } catch (error) {
      Alert.alert('No se pudo abrir el archivo', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    }
  };

  const enviar = async () => {
    if (settings.dataSource !== 'api') {
      Alert.alert('Demostración', 'Activa la API real y autentícate para enviar comprobantes.');
      return;
    }
    if (!archivo) {
      Alert.alert('Adjunta el comprobante', 'Debes seleccionar una imagen o PDF del pago.');
      return;
    }
    const ref = referencia.trim();
    if (ref && (ref.length < 4 || ref.length > 100)) {
      Alert.alert('Referencia incorrecta', 'Usa 4 a 100 caracteres o deja vacío el campo.');
      return;
    }
    setEnviando(true);
    try {
      await enviarComprobante(pago.id, ref, archivo);
      setEnRevision(true);
      Alert.alert('Comprobante recibido', 'Tu pago permanece pendiente. Un responsable revisará el comprobante y comprobará el abono en el banco.');
      onReportado();
    } catch (error) {
      Alert.alert('No se pudo enviar', error instanceof Error ? error.message : 'Verifica tu conexión.');
    } finally {
      setEnviando(false);
    }
  };

  return <View style={styles.container}>
    <Txt bold size={15}>Pagar el servicio del locker</Txt>
    <Txt size={13} style={styles.amount}>Importe registrado: Bs {pago.monto.toFixed(2)}</Txt>
    <Image source={qrBancario} style={styles.qr} resizeMode="contain" accessibilityLabel="Código QR bancario de Cofre Express" />
    <Txt muted size={11} style={styles.note}>
      Escanea el QR con la aplicación de tu banco. Comprueba beneficiario, moneda y monto antes de transferir.
    </Txt>
    <Txt bold size={12}>Después de pagar, adjunta tu comprobante</Txt>
    <Button variant="outline" label={archivo ? 'Cambiar archivo' : 'Seleccionar imagen o PDF'} onPress={() => { void seleccionar(); }} disabled={enviando || enRevision}/>
    {archivo ? <View style={styles.attached}>
      <Txt bold size={12}>{archivo.name}</Txt>
      <Txt muted size={11}>{archivo.size ? `${(archivo.size / 1024).toFixed(0)} KB` : 'Tamaño no indicado'} · JPG, PNG, WebP o PDF</Txt>
      {archivo.mimeType?.startsWith('image/') ? <Image source={{uri:archivo.uri}} style={styles.preview} resizeMode="contain" /> : null}
    </View> : null}
    <TextInput
      value={referencia} onChangeText={setReferencia} style={styles.input}
      placeholder="Número de operación (opcional)" placeholderTextColor={colors.muted}
      accessibilityLabel="Referencia del comprobante" autoCapitalize="characters" maxLength={100}
      editable={!enRevision && !enviando}
    />
    <Button
      label={enviando ? 'Enviando comprobante...' : enRevision ? 'Comprobante enviado para revisión' : 'Enviar comprobante para verificar'}
      disabled={enviando || enRevision || !archivo}
      onPress={() => { void enviar(); }}
    />
    <Txt muted size={11} style={styles.note}>
      El comprobante NO confirma que recibimos el dinero. El cargo seguirá pendiente hasta que un revisor autorizado verifique el movimiento bancario.
    </Txt>
    {settings.dataSource === 'mock' ? <Txt bold size={11} style={{color:colors.deepAmber}}>DEMOSTRACIÓN: no se envían pagos ni archivos reales.</Txt> : null}
  </View>;
}

const styles = StyleSheet.create({
  container:{gap:11},
  amount:{textAlign:'center',fontWeight:'700',color:colors.ink,marginTop:4},
  qr:{width:275,height:275,alignSelf:'center',backgroundColor:'#FFFFFF'},
  note:{lineHeight:17},
  input:{borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:12,paddingVertical:11,backgroundColor:'#FFFFFF',color:colors.ink},
  attached:{backgroundColor:'#FFF9ED',padding:12,borderRadius:12,gap:6},
  preview:{width:180,height:130,alignSelf:'center'},
});
