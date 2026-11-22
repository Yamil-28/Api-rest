import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, TextInput, View } from 'react-native';
import { Header, ScreenBody, Button, Card, Txt, Status } from '../../components/Primitives';
import { useApp } from '../../context/AppContext';
import { obtenerReportesPendientes, enlaceComprobante, aprobarReporteBancario, rechazarReporteBancario, type ReportePago } from '../../api/HttpRepository';
import { colors } from '../../config/theme';

/** Revisor autorizado: el archivo es evidencia, NO valida por si solo el pago. */
export function RevisarPagosScreen() {
  const {revisor, back} = useApp();
  const [reportes, setReportes] = useState<ReportePago[]>([]);
  const [cargando, setCargando] = useState(false);
  const [accion, setAccion] = useState<string | null>(null);
  const [montos, setMontos] = useState<Record<string,string>>({});
  const [motivos, setMotivos] = useState<Record<string,string>>({});
  const [verificados, setVerificados] = useState<Record<string,boolean>>({});
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (!revisor) return;
    setCargando(true); setError('');
    try { setReportes(await obtenerReportesPendientes()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error consultando reportes'); }
    finally { setCargando(false); }
  },[revisor]);
  useEffect(() => { void recargar(); },[recargar]);

  const abrir = async (reporteId:string) => {
    setAccion(reporteId);
    try {
      const data = await enlaceComprobante(reporteId);
      await Linking.openURL(data.url);
    } catch (e) { Alert.alert('No se pudo abrir',e instanceof Error?e.message:'Verifica tu conexión'); }
    finally { setAccion(null); }
  };
  const aprobar = async (r:ReportePago) => {
    if (!r.tieneComprobante) return Alert.alert('Falta comprobante','No se permite confirmar sin archivo adjunto.');
    if (!verificados[r.reporteId]) return Alert.alert('Revisión requerida','Debes comprobar en tu banco el abono, el beneficiario y el importe real.');
    const value = Number((montos[r.reporteId] || '').trim().replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return Alert.alert('Importe requerido','Escribe el importe que verificaste en el banco.');
    const centavos = Math.round(value * 100);
    if (centavos !== Math.round(r.montoBolivianos * 100)) return Alert.alert('Importe diferente','El importe verificado no coincide con el cargo. No aprobar.');
    setAccion(r.reporteId);
    try {
      await aprobarReporteBancario(r.reporteId,centavos);
      Alert.alert('Pago confirmado','El cargo cambió a PAGADO después de tu revisión bancaria.');
      await recargar();
    } catch (e) { Alert.alert('No se aprobó',e instanceof Error ? e.message:'Inténtalo nuevamente'); }
    finally { setAccion(null); }
  };
  const rechazar = async (r:ReportePago) => {
    const motivo=(motivos[r.reporteId]||'').trim();
    if(motivo.length<5) return Alert.alert('Motivo requerido','Describe brevemente por qué se rechaza este comprobante.');
    setAccion(r.reporteId);
    try { await rechazarReporteBancario(r.reporteId,motivo); await recargar(); }
    catch(e){Alert.alert('No se rechazó',e instanceof Error?e.message:'Inténtalo de nuevo');}
    finally{setAccion(null);}
  };

  return <><Header title="Revisar comprobantes" subtitle="Solo responsable autorizado" back={back}/>
    <ScreenBody>
      {!revisor ? <Card><Txt>Tu cuenta no está autorizada para revisar pagos.</Txt></Card> : <>
        <Card><Txt bold>Confirmación manual bancaria</Txt>
          <Txt muted size={11}>El archivo es solo evidencia. Antes de aprobar, verifica el dinero recibido, el nombre del beneficiario, la referencia y el importe en el portal oficial del banco.</Txt>
          <Button label={cargando?'Consultando...':'Actualizar reportes'} variant="outline" disabled={cargando} onPress={()=>{void recargar();}} />
        </Card>
        {error?<Card><Status text="Error de consulta" tone="red"/><Txt>{error}</Txt></Card>:null}
        {!cargando && reportes.length===0 && !error ? <Card><Txt>No hay comprobantes pendientes.</Txt></Card> : null}
        {reportes.map(r => <Card key={r.reporteId} style={styles.card}>
          <Txt bold size={14}>Cargo #{r.cargoId} · Paquete #{r.paqueteId}</Txt>
          <Txt>Bs {r.montoBolivianos.toFixed(2)}</Txt>
          <Txt muted size={11}>Referencia: {r.referencia || 'No indicada'}</Txt>
          <Txt muted size={11}>Reportado: {r.fecha}</Txt>
          <Status text={r.tieneComprobante ? 'Comprobante adjunto' : 'Sin archivo'} tone={r.tieneComprobante?'blue':'red'}/>
          {r.tieneComprobante ? <Button label="Abrir comprobante (enlace temporal)" variant="outline"
            disabled={accion===r.reporteId} onPress={()=>{void abrir(r.reporteId);}} />:null}
          <TextInput style={styles.field} keyboardType="decimal-pad"
            placeholder="Importe comprobado en banco (Bs)" placeholderTextColor={colors.muted}
            value={montos[r.reporteId] || ''} onChangeText={v=>setMontos(s=>({...s,[r.reporteId]:v}))}/>
          <Button variant={verificados[r.reporteId]?'amber':'outline'}
            label={verificados[r.reporteId]?'✓ Verificación bancaria realizada':'Marcar verificación bancaria (obligatorio)'}
            onPress={()=>setVerificados(s=>({...s,[r.reporteId]:!s[r.reporteId]}))}/>
          <Button label="Aprobar pago" disabled={!r.tieneComprobante || !verificados[r.reporteId] || accion===r.reporteId}
            onPress={()=>{void aprobar(r);}} />
          <View style={{height:6}}/>
          <TextInput style={[styles.field,{minHeight:60}]} multiline placeholder="Motivo del rechazo" placeholderTextColor={colors.muted}
            value={motivos[r.reporteId] || ''} onChangeText={v=>setMotivos(s=>({...s,[r.reporteId]:v}))}/>
          <Button label="Rechazar comprobante" variant="outline" disabled={accion===r.reporteId}
            onPress={()=>{void rechazar(r);}}/>
        </Card>)}
      </>}
    </ScreenBody></>;
}
const styles=StyleSheet.create({card:{gap:10},field:{borderWidth:1,borderColor:colors.line,backgroundColor:'#fff',borderRadius:10,padding:11,color:colors.ink}});
