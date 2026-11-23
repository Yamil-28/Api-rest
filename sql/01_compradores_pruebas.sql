create table public.compradores (
  id bigint generated always as identity not null,
  usuario_id bigint null,
  direccion text null,
  constraint compradores_pkey primary key (id),
  constraint compradores_usuario_id_fkey foreign KEY (usuario_id) references usuarios (id)
) TABLESPACE pg_default;