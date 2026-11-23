create table public.usuarios (
  id bigint generated always as identity not null,
  nombre text not null,
  email text not null,
  telefono text null,
  constraint usuarios_pkey primary key (id),
  constraint usuarios_email_key unique (email)
) TABLESPACE pg_default;