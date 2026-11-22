import React from 'react';
import { View } from 'react-native';
import { repository } from '../../api';
import { useRemote } from '../../hooks/useRemote';
import { useApp } from '../../context/AppContext';
import { Card, Txt, Header, ScreenBody, Status, InfoRow, DemoFlag, ResourceGate, Empty } from '../../components/Primitives';
import { fechaCorta } from '../../domain/format';
export function HistorialScreen(){const {back,perfilId,paquete}=useApp();
 const {data,loading,error,reload}=useRemote(()=>repository.listarEntregas(perfilId),[perfilId]);
 return <><Header title="Historial de entregas" subtitle="Registro de paquetes finalizados" back={back}/><ScreenBody><DemoFlag/>
 <ResourceGate loading={loading} error={error} onRetry={reload}>
 {data?.length ? data.map(entrega=><Card key={entrega.id}>
  <View style={{alignItems:'flex-start',gap:7}}><Status text="Entrega confirmada" tone="green"/><Txt size={15} bold>{entrega.id}</Txt><Txt size={11} muted>Código del paquete: PK-{entrega.paqueteId}</Txt></View>
  <InfoRow label="Fecha de entrega" value={fechaCorta(entrega.fecha)}/><InfoRow label="Punto de retiro" value={entrega.destino}/><InfoRow label="Entregado a" value={entrega.receptor}/><InfoRow label="Costo" value={`Bs ${entrega.costo}`}/>
  </Card>) : <Empty title="Sin entregas" description="Todavía no hay historial disponible."/>}
 </ResourceGate>
 </ScreenBody></>;
}
