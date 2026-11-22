import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../../context/AppContext';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import {
  Card,
  Txt,
  Header,
  ScreenBody,
  Chip,
  PillInfo,
  DemoFlag,
  ResourceGate,
  Empty,
  IconTile,
  Status,
} from '../../components/Primitives';
import { colors } from '../../config/theme';
import { settings } from '../../config/env';
import type { EstadoPago } from '../../domain/models';

type FiltroPago = 'TODOS' | EstadoPago;

const filtros: { id: FiltroPago; titulo: string }[] = [
  { id: 'TODOS', titulo: 'Todos' },
  { id: 'PENDIENTE', titulo: 'Pagos pendientes' },
  { id: 'PAGADO', titulo: 'Pagados' },
];

export function PagosScreen() {
  const { perfilId } = useApp();

  const [estado, setEstado] = useState<FiltroPago>('TODOS');

  const { data, loading, error, reload } = useRemote(
    () => repository.listarPagos(perfilId),
    [perfilId],
  );

  const pagosReales =
    settings.pagosSource === 'api' ||
    settings.dataSource === 'api';

  const pagosFiltrados = useMemo(
    () =>
      (data ?? []).filter(
        pago => estado === 'TODOS' || pago.estado === estado,
      ),
    [data, estado],
  );

  const pendientes = (data ?? []).filter(
    pago => pago.estado === 'PENDIENTE',
  );

  const totalPendiente = pendientes.reduce(
    (suma, pago) => suma + pago.monto,
    0,
  );

  const completados = (data ?? []).filter(
    pago => pago.estado === 'PAGADO',
  ).length;

  return (
    <>
      <Header
        title="Pagos del locker"
        subtitle={
          pagosReales
            ? 'Consulta general de pagos · Sin filtro por usuario'
            : 'Consulta quién debe pagar por cada paquete'
        }
      />

      <ScreenBody>
        {!pagosReales && <DemoFlag />}

        <ResourceGate
          loading={loading}
          error={error}
          onRetry={reload}
        >
          <View style={styles.resumen}>
            <PillInfo
              label="Total pendiente"
              value={`Bs ${totalPendiente.toFixed(2)}`}
            />

            <PillInfo
              label="Pendientes"
              value={`${pendientes.length}`}
            />

            <PillInfo
              label="Completados"
              value={`${completados}`}
            />
          </View>

          <View style={styles.filters}>
            {filtros.map(filtro => (
              <Chip
                key={filtro.id}
                label={filtro.titulo}
                active={estado === filtro.id}
                onPress={() => setEstado(filtro.id)}
              />
            ))}
          </View>

          {pagosFiltrados.length === 0 ? (
            <Empty
              title="No hay pagos"
              description="No existen registros para el filtro elegido."
            />
          ) : (
            pagosFiltrados.map(pago => {
              const pagado = pago.estado === 'PAGADO';

              const responsable =
                pago.pagador === 'comerciante'
                  ? 'Debe pagar: Comerciante'
                  : pago.pagador === 'comprador'
                    ? 'Debe pagar: Comprador'
                    : 'Responsable por definir';

              return (
                <Card key={pago.id}>
                  <View style={styles.row}>
                    <IconTile name="credit-card" />

                    <View style={styles.descripcion}>
                      <Txt size={12} bold numberOfLines={2}>
                        {pago.titulo}
                      </Txt>

                      <Txt
                        size={10}
                        muted
                        style={styles.responsable}
                      >
                        {responsable}
                      </Txt>
                    </View>

                    <Txt size={16} bold>
                      Bs {pago.monto.toFixed(2)}
                    </Txt>
                  </View>

                  <View style={styles.estado}>
                    <Status
                      text={pagado ? 'Sin deuda' : 'Pago pendiente'}
                      tone={pagado ? 'green' : 'amber'}
                    />

                    <Feather
                      name={pagado ? 'check-circle' : 'clock'}
                      size={15}
                      color={pagado ? colors.green : colors.muted}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </ResourceGate>
      </ScreenBody>
    </>
  );
}

const styles = StyleSheet.create({
  resumen: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descripcion: {
    flex: 1,
  },
  responsable: {
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
  },
  estado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});