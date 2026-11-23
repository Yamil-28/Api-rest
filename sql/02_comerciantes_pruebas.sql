create table public.comerciantes (
  id bigint generated always as identity not null,
  usuario_id bigint null,
  nombre_comercial text not null,
  constraint comerciantes_pkey primary key (id),
  constraint comerciantes_usuario_id_fkey foreign KEY (usuario_id) references usuarios (id)
) TABLESPACE pg_default;