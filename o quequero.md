Vamos tentar resolver isso, segue dado erro, quando edito o usuário tentanto mudar o tipo de negocio ao qual ele pertence, da erro. 

661-bdcc899354e3647e.js:1 User string from localStorage: {"id":"24","email":"karllosmartins1000@gmail.com","name":"Karllos Martins","role":"admin","created_at":"2025-09-03T00:32:07.725098+00:00","active":true}
661-bdcc899354e3647e.js:1 Usuario atual: {id: '24', email: 'karllosmartins1000@gmail.com', name: 'Karllos Martins', role: 'admin', created_at: '2025-09-03T00:32:07.725098+00:00', …}
feature_collector.js:23 using deprecated parameters for the initialization function; pass a single object instead
H @ feature_collector.js:23
main @ feature_collector.js:23
mainFunction @ feature_collector.js:23
(anônimo) @ feature_collector.js:23
619-0dfc518035577b07.js:21  PATCH https://enwxbkyvnrjderqdygtl.supabase.co/rest/v1/users?id=eq.27 400 (Bad Request)
(anônimo) @ 619-0dfc518035577b07.js:21
(anônimo) @ 619-0dfc518035577b07.js:21
fulfilled @ 619-0dfc518035577b07.js:21
Promise.then
step @ 619-0dfc518035577b07.js:21
(anônimo) @ 619-0dfc518035577b07.js:21
lib_fetch_awaiter @ 619-0dfc518035577b07.js:21
(anônimo) @ 619-0dfc518035577b07.js:21
then @ 619-0dfc518035577b07.js:1
472-ceed697e056bc12d.js:1 Erro ao atualizar usuário: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'delay_apos_intervencao' column of 'users' in the schema cache"}
window.console.error @ 472-ceed697e056bc12d.js:1
handleUpdateUser @ page-a60b7be448c24525.js:1
await in handleUpdateUser
handleSave @ page-a60b7be448c24525.js:1
Hi @ fd9d1056-053a427fed818d2b.js:9
Ni @ fd9d1056-053a427fed818d2b.js:9
Oi @ fd9d1056-053a427fed818d2b.js:9
Nn @ fd9d1056-053a427fed818d2b.js:9
Zm @ fd9d1056-053a427fed818d2b.js:9
(anônimo) @ fd9d1056-053a427fed818d2b.js:9
Ak @ fd9d1056-053a427fed818d2b.js:9
ll @ fd9d1056-053a427fed818d2b.js:9
zm @ fd9d1056-053a427fed818d2b.js:9
xm @ fd9d1056-053a427fed818d2b.js:9
wm @ fd9d1056-053a427fed818d2b.js:9


create table public.users (
  id bigserial not null,
  name text not null,
  email text not null,
  password text not null,
  role text not null,
  active boolean null default true,
  cpf character varying(14) null,
  telefone character varying(20) null,
  plano text null default 'basico'::text,
  limite_leads integer null default 100,
  limite_consultas integer null default 10,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  numero_instancias bigint null,
  plano_id bigint null,
  plano_customizado jsonb null,
  leads_consumidos integer null default 0,
  consultas_realizadas integer null default 0,
  ultimo_reset_contagem timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_cpf_key unique (cpf),
  constraint users_email_key unique (email),
  constraint users_plano_id_fkey foreign KEY (plano_id) references planos (id),
  constraint users_plano_check check (
    (
      plano = any (
        array[
          'basico'::text,
          'premium'::text,
          'enterprise'::text
        ]
      )
    )
  ),
  constraint users_role_check check ((role = any (array['admin'::text, 'user'::text])))
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_cpf on public.users using btree (cpf) TABLESPACE pg_default;

create index IF not exists idx_users_plano_id on public.users using btree (plano_id) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create table public.planos (
  id bigserial not null,
  nome character varying(100) not null,
  descricao text null,
  acesso_dashboard boolean null default true,
  acesso_crm boolean null default true,
  acesso_whatsapp boolean null default true,
  acesso_disparo_simples boolean null default true,
  acesso_disparo_ia boolean null default false,
  acesso_agentes_ia boolean null default false,
  acesso_extracao_leads boolean null default false,
  acesso_enriquecimento boolean null default false,
  acesso_usuarios boolean null default false,
  limite_leads integer null default 1000,
  limite_consultas integer null default 100,
  limite_instancias integer null default 1,
  ativo boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  acesso_consulta boolean null default false,
  constraint planos_pkey primary key (id),
  constraint planos_nome_key unique (nome)
) TABLESPACE pg_default;

create index IF not exists idx_planos_ativo on public.planos using btree (ativo) TABLESPACE pg_default;

create index IF not exists idx_planos_nome on public.planos using btree (nome) TABLESPACE pg_default;