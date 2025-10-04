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
  base_leads_supabase text null default 'leads'::text,
  base_mensagens_supabase text null,
  base_agentes_supabase text null default 'agentes_ia'::text,
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