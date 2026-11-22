import React, { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { repository } from '../../api';
import { generarQRPago } from '../../api/HttpRepository';
import { settings } from '../../config/env';
import { useRemote } from '../../hooks/useRemote';
import { Card, Txt, Header, ScreenBody, Chip, PillInfo, DemoFlag, ResourceGate, Empty, IconTile, Status, Button } from '../../components/Primitives';
import { colors } from '../../config/theme';
import type { EstadoPago } from '../../domain/models';
import { QRBancarioManual } from './QRBancarioManual';

export function PagosScreen() {
  const { perfilId, role } = useApp();
  const [qr, setQR] = useState<{cargoId: number; imagen: string; expira: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualId, setManualId] = useState<number | null>(null);
  const [estado, setEstado] = useState<'TODOS' | EstadoPago>('TODOS');
  const { data, loading, error, reload } = useRemote(() => repository.listarPagos(perfilId), [perfilId, role]);
  const filtered = useMemo(() => (data || []).filter(x => estado === 'TODOS' || x.estado === estado), [data, estado]);
  const total = (data || []).reduce((s, p) => s + p.monto, 0);
  const pending = (data || []).filter(p => p.estado === 'PENDIENTE');
  const manualPago = (data || []).find(p => p.id === manualId && p.estado === 'PENDIENTE');

  const generar = async (cargoId: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await generarQRPago(cargoId);
      setQR({ cargoId, imagen: result.qr_imagen, expira: result.expira });
    } catch (e) {
      Alert.alert('QR no disponible', e instanceof Error ? e.message : 'Error al generar QR');
    } finally { setBusy(false); }
  };

  return <>
    <Header title="Pagos del locker" subtitle="Consulta quién debe pagar por cada paquete" />
    <ScreenBody>
      <DemoFlag />
      <ResourceGate loading={loading} error={error} onRetry={reload}>
        <View style={{flexDirection: 'row', gap: 8}}>
          <PillInfo label="Total asociado" value={`Bs ${total.toFixed(2)}`} />
          <PillInfo label="Pendientes" value={`${pending.length}`} />
          <PillInfo label="Completados" value={`${(data || []).filter(p => p.estado === 'PAGADO').length}`} />
        </View>
        <View style={styles.filters}>
          {[
            { id: 'TODOS', t: 'Todos' },
            { id: 'PENDIENTE', t: 'Pagos pendientes' },
            { id: 'PAGADO', t: 'Pagados' },
          ].map(f => <Chip key={f.id} label={f.t} active={estado === f.id} onPress={() => setEstado(f.id as 'TODOS' | EstadoPago)} />)}
        </View>
        {filtered.length === 0 ? <Empty title="No hay pagos" description="No existen registros para el filtro elegido." /> : filtered.map(p =>
          <Card key={p.id}>
            <View style={styles.row}>
              <IconTile name="credit-card" />
              <View style={{flex: 1}}>
                <Txt size={12} bold numberOfLines={2}>{p.titulo}</Txt>
                <Txt size={10} muted style={{marginTop: 4}}>Debe pagar: {p.pagador === 'comerciante' ? 'Comerciante' : 'Comprador'}</Txt>
              </View>
              <Txt size={16} bold>Bs {p.monto.toFixed(2)}</Txt>
            </View>
            <View style={styles.rowStatus}>
              <Status text={p.estado === 'PAGADO' ? 'Pagado' : p.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente de confirmación'} tone={p.estado === 'PAGADO' ? 'green' : 'amber'} />
              <Feather name="check-circle" size={15} color={p.estado === 'PAGADO' ? colors.green : colors.muted} />
            </View>
            {p.estado === 'PENDIENTE' && p.pagador === role ?
              <View style={{marginTop: 12}}>
                {settings.qrPagoModo === 'manual' ?
                  <Button label={manualId === p.id ? 'Ocultar QR bancario' : 'Mostrar QR bancario'} onPress={() => setManualId(manualId === p.id ? null : p.id)} /> :
                  settings.dataSource === 'api' ? <Button label={busy ? 'Generando...' : 'Generar QR bancario'} disabled={busy} onPress={() => { void generar(p.id); }} /> : null}
              </View> : null}
          </Card>)}
      </ResourceGate>
      {manualPago && settings.qrPagoModo === 'manual' ?
        <Card>
          <QRBancarioManual pago={manualPago} onReportado={reload} />
        </Card> : null}
      {qr && settings.qrPagoModo === 'pasarela' ?
        <Card>
          <Txt bold size={14}>QR bancario · cargo #{qr.cargoId}</Txt>
          <Image style={{width: 240, height: 240, alignSelf: 'center', marginTop: 12}} resizeMode="contain" source={{uri: `data:image/png;base64,${qr.imagen}`}} />
          <Txt muted size={11}>Expira: {qr.expira}. El QR no implica pago aprobado.</Txt>
          <View style={{marginTop: 10}}><Button label="Actualizar pagos" variant="outline" onPress={reload} /></View>
        </Card> : null}
    </ScreenBody>
  </>;
}
const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  rowStatus: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12},
  filters: {flexDirection: 'row', gap: 7, flexWrap: 'wrap'},
});
