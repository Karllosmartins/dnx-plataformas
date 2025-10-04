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

create table public.configuracoes_credenciais (
  id bigserial not null,
  user_id bigint not null,
  openai_api_token text null,
  gemini_api_key text null,
  model text null default 'gpt-4o'::text,
  type_tool_supabase text null default 'OpenAi'::text,
  reasoning_effort text null,
  apikey_elevenlabs text null,
  id_voz_elevenlabs text null,
  firecrawl_apikey text null,
  baseurl text null default 'https://wsapi.dnmarketing.com.br'::text,
  instancia text null,
  apikey text null,
  base_tools_supabase text null,
  base_leads_supabase text null,
  base_mensagens_supabase text null,
  base_agentes_supabase text null,
  base_rag_supabase text null,
  structured_output jsonb null,
  delay_entre_mensagens_em_segundos integer null default 30,
  delay_apos_intervencao_humana_minutos integer null default 0,
  inicio_expediente integer null default 8,
  fim_expediente integer null default 18,
  url_crm text null,
  usuario_crm text null,
  senha_crm text null,
  token_crm text null,
  pasta_drive text null,
  id_pasta_drive_rag text null,
  cliente text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  apikeydados text null,
  constraint configuracoes_credenciais_pkey primary key (id),
  constraint unique_user_config unique (user_id),
  constraint configuracoes_credenciais_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_config_user_id on public.configuracoes_credenciais using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_config_instancia on public.configuracoes_credenciais using btree (instancia) TABLESPACE pg_default;

create trigger update_configuracoes_updated_at BEFORE
update on configuracoes_credenciais for EACH row
execute FUNCTION update_updated_at_column ();

create table public.user_tipos_negocio (
  id bigserial not null,
  user_id bigint not null,
  tipo_negocio_id bigint not null,
  configuracoes_usuario jsonb null default '{}'::jsonb,
  ativo boolean null default true,
  data_atribuicao timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_tipos_negocio_pkey primary key (id),
  constraint unique_user_tipo unique (user_id, tipo_negocio_id),
  constraint user_tipos_negocio_tipo_negocio_id_fkey foreign KEY (tipo_negocio_id) references tipos_negocio (id) on delete CASCADE,
  constraint user_tipos_negocio_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_tipos_negocio_user_id on public.user_tipos_negocio using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_tipos_negocio_tipo_id on public.user_tipos_negocio using btree (tipo_negocio_id) TABLESPACE pg_default;

create index IF not exists idx_user_tipos_negocio_ativo on public.user_tipos_negocio using btree (ativo) TABLESPACE pg_default;

create trigger update_user_tipos_negocio_updated_at BEFORE
update on user_tipos_negocio for EACH row
execute FUNCTION update_updated_at_column ();

create table public.tipos_negocio (
  id bigserial not null,
  nome character varying(50) not null,
  nome_exibicao character varying(100) not null,
  descricao text null,
  icone character varying(50) null default 'building'::character varying,
  cor character varying(7) null default '#3B82F6'::character varying,
  campos_personalizados jsonb null default '[]'::jsonb,
  status_personalizados jsonb null default '[]'::jsonb,
  metricas_config jsonb null default '{"campos_receita": [], "campos_conversao": [], "metricas_principais": []}'::jsonb,
  ativo boolean null default true,
  ordem integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tipos_negocio_pkey primary key (id),
  constraint tipos_negocio_nome_key unique (nome)
) TABLESPACE pg_default;

create index IF not exists idx_tipos_negocio_nome on public.tipos_negocio using btree (nome) TABLESPACE pg_default;

create index IF not exists idx_tipos_negocio_ativo on public.tipos_negocio using btree (ativo) TABLESPACE pg_default;

create trigger update_tipos_negocio_updated_at BEFORE
update on tipos_negocio for EACH row
execute FUNCTION update_updated_at_column ();