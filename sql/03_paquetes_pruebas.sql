create table public.paquetes (
  id bigint generated always as identity not null,
  comerciante_id bigint not null,
  comprador_id bigint not null,
  codigo_interno text not null,
  numero_seguimiento text null,
  descripcion text null,
  fecha_recepcion timestamp with time zone not null default now(),
  estado text not null default 'RECIBIDO'::text,
  constraint paquetes_pkey primary key (id),
  constraint paquetes_codigo_interno_key unique (codigo_interno),
  constraint paquetes_comerciante_id_fkey foreign KEY (comerciante_id) references comerciantes (id),
  constraint paquetes_comprador_id_fkey foreign KEY (comprador_id) references compradores (id),
  constraint paquetes_estado_check check (
    (
      estado = any (
        array[
          'RECIBIDO'::text,
          'ALMACENADO'::text,
          'PENDIENTE_RETIRO'::text,
          'ENTREGADO'::text,
          'CANCELADO'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;