create table public.workspaces (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  plano_id integer null,
  settings jsonb null default '{}'::jsonb,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint workspaces_pkey primary key (id),
  constraint workspaces_slug_key unique (slug),
  constraint workspaces_plano_id_fkey foreign KEY (plano_id) references planos (id)
) TABLESPACE pg_default;

create index IF not exists idx_workspaces_slug on public.workspaces using btree (slug) TABLESPACE pg_default;

create trigger update_workspaces_updated_at BEFORE
update on workspaces for EACH row
execute FUNCTION update_updated_at_column ();

create table public.workspace_members (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  user_id integer null,
  role text not null,
  permissions jsonb null default '{}'::jsonb,
  joined_at timestamp without time zone null default now(),
  invited_by integer null,
  constraint workspace_members_pkey primary key (id),
  constraint workspace_members_workspace_id_user_id_key unique (workspace_id, user_id),
  constraint workspace_members_invited_by_fkey foreign KEY (invited_by) references users (id),
  constraint workspace_members_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint workspace_members_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id) on delete CASCADE,
  constraint workspace_members_role_check check (
    (
      role = any (
        array[
          'owner'::text,
          'admin'::text,
          'member'::text,
          'viewer'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_workspace_members_workspace on public.workspace_members using btree (workspace_id) TABLESPACE pg_default;

create index IF not exists idx_workspace_members_user on public.workspace_members using btree (user_id) TABLESPACE pg_default;

create table public.whatsapp_templates (
  id bigserial not null,
  instancia_id bigint not null,
  template_name text not null,
  template_language text not null default 'pt_BR'::text,
  template_category text not null,
  template_status text not null,
  template_components jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint whatsapp_templates_pkey primary key (id),
  constraint whatsapp_templates_instancia_id_template_name_template_lang_key unique (instancia_id, template_name, template_language),
  constraint whatsapp_templates_instancia_id_fkey foreign KEY (instancia_id) references instancia_whtats (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_templates_instancia_id on public.whatsapp_templates using btree (instancia_id) TABLESPACE pg_default;

create index IF not exists idx_templates_name on public.whatsapp_templates using btree (template_name) TABLESPACE pg_default;

create index IF not exists idx_templates_status on public.whatsapp_templates using btree (template_status) TABLESPACE pg_default;

create trigger update_templates_updated_at BEFORE
update on whatsapp_templates for EACH row
execute FUNCTION update_updated_at_column ();

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
  current_workspace_id uuid null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_cpf_key unique (cpf),
  constraint users_current_workspace_id_fkey foreign KEY (current_workspace_id) references workspaces (id),
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

create index IF not exists idx_users_current_workspace on public.users using btree (current_workspace_id) TABLESPACE pg_default;

create index IF not exists idx_users_plano_id on public.users using btree (plano_id) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create table public.user_tools (
  id serial not null,
  user_id integer not null,
  tool_id integer not null,
  agente_id bigint null,
  is_active boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint user_tools_pkey primary key (id),
  constraint user_tools_agente_id_fkey foreign KEY (agente_id) references agentes_ia (id),
  constraint user_tools_tool_id_fkey foreign KEY (tool_id) references tools (id),
  constraint user_tools_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

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

create table public.user_agent_vectorstore (
  id serial not null,
  user_id bigint not null,
  agent_id bigint not null,
  vectorstore_id text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint user_agent_vectorstore_pkey primary key (id),
  constraint unique_user_agent_vectorstore unique (user_id, agent_id, vectorstore_id),
  constraint user_agent_vectorstore_agent_id_fkey foreign KEY (agent_id) references agentes_ia (id),
  constraint user_agent_vectorstore_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_user_agent_vectorstore_vectorstore_id on public.user_agent_vectorstore using btree (vectorstore_id) TABLESPACE pg_default;

create index IF not exists idx_user_agent_vectorstore_user_id on public.user_agent_vectorstore using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_agent_vectorstore_active on public.user_agent_vectorstore using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_user_agent_vectorstore_user_active on public.user_agent_vectorstore using btree (user_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_user_agent_vectorstore_agent_id on public.user_agent_vectorstore using btree (agent_id) TABLESPACE pg_default;
create table public.tools (
  id serial not null,
  type character varying(50) not null,
  nome character varying(255) not null,
  descricao text null,
  tool jsonb not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint tools_pkey primary key (id)
) TABLESPACE pg_default;

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
  acesso_integracoes boolean null default true,
  produtos boolean null,
  acesso_arquivos boolean null default false,
  constraint planos_pkey primary key (id),
  constraint planos_nome_key unique (nome)
) TABLESPACE pg_default;

create index IF not exists idx_planos_ativo on public.planos using btree (ativo) TABLESPACE pg_default;

create index IF not exists idx_planos_nome on public.planos using btree (nome) TABLESPACE pg_default;

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
  acesso_integracoes boolean null default true,
  produtos boolean null,
  acesso_arquivos boolean null default false,
  constraint planos_pkey primary key (id),
  constraint planos_nome_key unique (nome)
) TABLESPACE pg_default;

create index IF not exists idx_planos_ativo on public.planos using btree (ativo) TABLESPACE pg_default;

create index IF not exists idx_planos_nome on public.planos using btree (nome) TABLESPACE pg_default;
create table public.leads (
  id bigserial not null,
  user_id bigint not null,
  created_at timestamp without time zone null default now(),
  remotejid text null default ''::text,
  response_id text null,
  atendimentofinalizado boolean null default false,
  conversation_log jsonb null default '[]'::jsonb,
  times_tamp text null default ''::text,
  tokens integer null default 0,
  user_lastinteraction text null,
  bot_lastinteraction text null,
  lead_id text null,
  contact_id text null,
  numero_formatado text null,
  email_usuario text null,
  task_id text null,
  site_usuario text null,
  link_meet text null,
  numero_follow text null,
  instance text null,
  nome_cliente text null,
  id_calendar text null,
  data_agendamento text null,
  hora_agendamento text null,
  "Agente_ID" text null default '1'::text,
  data_folowup_solicitado text null,
  folowup_solicitado boolean null default false,
  id_card timestamp with time zone null,
  existe_whatsapp boolean null,
  responsavel_encontrado boolean null default false,
  falando_com_responsavel boolean null default false,
  efetuar_disparo boolean null,
  nome_empresa text null,
  id_empresa text null,
  nome_campanha text null,
  cpf_cnpj character varying(14) null,
  telefone character varying(20) null,
  origem text null default 'WhatsApp'::text,
  status_limpa_nome text null default 'novo_lead'::text,
  valor_estimado_divida numeric(10, 2) null,
  valor_real_divida numeric(10, 2) null,
  valor_pago_consulta numeric(10, 2) null,
  valor_contrato numeric(10, 2) null,
  tempo_negativado text null,
  tipo_consulta_interesse text null,
  motivo_desqualificacao text null,
  data_pagamento timestamp with time zone null,
  link_pagamento text null,
  data_consulta timestamp with time zone null,
  orgaos_negativados text[] null,
  link_relatorio text null,
  observacoes_limpa_nome text null,
  data_escalacao timestamp with time zone null,
  vendedor_responsavel text null,
  data_fechamento timestamp with time zone null,
  data_ultima_atividade timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status_disparo text null,
  tipo_negocio_id bigint null,
  dados_personalizados jsonb null default '{}'::jsonb,
  status_generico character varying(50) null,
  workspace_id uuid null,
  constraint leads_pkey primary key (id),
  constraint leads_tipo_negocio_id_fkey foreign KEY (tipo_negocio_id) references tipos_negocio (id),
  constraint leads_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint leads_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id),
  constraint leads_status_limpa_nome_check check (
    (
      status_limpa_nome = any (
        array[
          'novo_lead'::text,
          'qualificacao'::text,
          'desqualificado'::text,
          'pagamento_consulta'::text,
          'nao_consta_divida'::text,
          'consta_divida'::text,
          'enviado_para_negociacao'::text,
          'cliente_fechado'::text
        ]
      )
    )
  ),
  constraint leads_valor_pago_consulta_check check (
    (
      valor_pago_consulta = any (array[(30)::numeric, (199)::numeric])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_leads_user_id on public.leads using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_leads_cpf on public.leads using btree (cpf_cnpj) TABLESPACE pg_default;

create index IF not exists idx_leads_telefone on public.leads using btree (telefone) TABLESPACE pg_default;

create index IF not exists idx_leads_numero_formatado on public.leads using btree (numero_formatado) TABLESPACE pg_default;

create index IF not exists idx_leads_status_limpa_nome on public.leads using btree (status_limpa_nome) TABLESPACE pg_default;

create index IF not exists idx_leads_nome_cliente on public.leads using btree (nome_cliente) TABLESPACE pg_default;

create index IF not exists idx_leads_instance on public.leads using btree (instance) TABLESPACE pg_default;

create index IF not exists idx_leads_data_atividade on public.leads using btree (data_ultima_atividade) TABLESPACE pg_default;

create index IF not exists idx_leads_workspace on public.leads using btree (workspace_id) TABLESPACE pg_default;

create index IF not exists idx_leads_tipo_negocio_id on public.leads using btree (tipo_negocio_id) TABLESPACE pg_default;

create index IF not exists idx_leads_dados_personalizados on public.leads using gin (dados_personalizados) TABLESPACE pg_default;

create index IF not exists idx_leads_status_generico on public.leads using btree (status_generico) TABLESPACE pg_default;

create index IF not exists idx_leads_user_tipo on public.leads using btree (user_id, tipo_negocio_id) TABLESPACE pg_default;

create trigger update_leads_updated_at BEFORE
update on leads for EACH row
execute FUNCTION update_updated_at_column ();
create table public.instancia_whtats (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  user_id bigint null,
  apikey text null,
  instancia text null,
  baseurl text null,
  waba_id text null,
  is_official_api boolean null default false,
  id_telefone text null,
  agante_id bigint null,
  workspace_id uuid null,
  constraint instancia_whtats_pkey primary key (id),
  constraint instancia_whtats_agante_id_fkey foreign KEY (agante_id) references agentes_ia (id),
  constraint instancia_whtats_user_id_fkey foreign KEY (user_id) references users (id),
  constraint instancia_whtats_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_instancia_waba_id on public.instancia_whtats using btree (waba_id) TABLESPACE pg_default;

create index IF not exists idx_instancia_official_api on public.instancia_whtats using btree (is_official_api) TABLESPACE pg_default;

create index IF not exists idx_instancia_whtats_workspace on public.instancia_whtats using btree (workspace_id) TABLESPACE pg_default;
create table public.instancia_whtats (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  user_id bigint null,
  apikey text null,
  instancia text null,
  baseurl text null,
  waba_id text null,
  is_official_api boolean null default false,
  id_telefone text null,
  agante_id bigint null,
  workspace_id uuid null,
  constraint instancia_whtats_pkey primary key (id),
  constraint instancia_whtats_agante_id_fkey foreign KEY (agante_id) references agentes_ia (id),
  constraint instancia_whtats_user_id_fkey foreign KEY (user_id) references users (id),
  constraint instancia_whtats_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_instancia_waba_id on public.instancia_whtats using btree (waba_id) TABLESPACE pg_default;

create index IF not exists idx_instancia_official_api on public.instancia_whtats using btree (is_official_api) TABLESPACE pg_default;

create index IF not exists idx_instancia_whtats_workspace on public.instancia_whtats using btree (workspace_id) TABLESPACE pg_default;
create table public.credencias_diversas (
  id bigint generated by default as identity not null,
  user_id bigint null,
  created_at timestamp with time zone not null default now(),
  google_calendar jsonb null default '{"email": "", "refresh_token": ""}'::jsonb,
  asaas jsonb null default '{"access_token": ""}'::jsonb,
  zapsign jsonb null default '{"token": "", "modelos": ""}'::jsonb,
  datecode jsonb null,
  constraint credencias_diversas_pkey primary key (id),
  constraint credencias_diversas_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_credencias_diversas_user_id on public.credencias_diversas using btree (user_id) TABLESPACE pg_default;

create table public.credencias_diversas (
  id bigint generated by default as identity not null,
  user_id bigint null,
  created_at timestamp with time zone not null default now(),
  google_calendar jsonb null default '{"email": "", "refresh_token": ""}'::jsonb,
  asaas jsonb null default '{"access_token": ""}'::jsonb,
  zapsign jsonb null default '{"token": "", "modelos": ""}'::jsonb,
  datecode jsonb null,
  constraint credencias_diversas_pkey primary key (id),
  constraint credencias_diversas_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_credencias_diversas_user_id on public.credencias_diversas using btree (user_id) TABLESPACE pg_default;

create table public.credencias_diversas (
  id bigint generated by default as identity not null,
  user_id bigint null,
  created_at timestamp with time zone not null default now(),
  google_calendar jsonb null default '{"email": "", "refresh_token": ""}'::jsonb,
  asaas jsonb null default '{"access_token": ""}'::jsonb,
  zapsign jsonb null default '{"token": "", "modelos": ""}'::jsonb,
  datecode jsonb null,
  constraint credencias_diversas_pkey primary key (id),
  constraint credencias_diversas_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_credencias_diversas_user_id on public.credencias_diversas using btree (user_id) TABLESPACE pg_default;
create table public.arquivos (
  id bigint generated by default as identity not null,
  nome text null,
  mimetype text null,
  mediatype text null,
  arquivo text null,
  descricao text null,
  produto text null,
  user_id bigint null,
  workspace_id uuid null,
  constraint arquivos_pkey primary key (id),
  constraint arquivos_id_key unique (id),
  constraint arquivos_user_id_fkey foreign KEY (user_id) references users (id),
  constraint arquivos_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_arquivos_workspace on public.arquivos using btree (workspace_id) TABLESPACE pg_default;

create trigger "Novo_arquivo"
after INSERT on arquivos for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://webhooks.dnmarketing.com.br/webhook/5845e1e5-4d06-4246-8f1e-c4253a45debd',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create table public.arquivos (
  id bigint generated by default as identity not null,
  nome text null,
  mimetype text null,
  mediatype text null,
  arquivo text null,
  descricao text null,
  produto text null,
  user_id bigint null,
  workspace_id uuid null,
  constraint arquivos_pkey primary key (id),
  constraint arquivos_id_key unique (id),
  constraint arquivos_user_id_fkey foreign KEY (user_id) references users (id),
  constraint arquivos_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_arquivos_workspace on public.arquivos using btree (workspace_id) TABLESPACE pg_default;

create trigger "Novo_arquivo"
after INSERT on arquivos for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://webhooks.dnmarketing.com.br/webhook/5845e1e5-4d06-4246-8f1e-c4253a45debd',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create table public.ads_leads (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  "remoteJid" text null,
  id2 text null,
  "pushName" text null,
  conversation text null,
  "conversionSource" text null,
  title text null,
  "mediaType" text null,
  "thumbnailUrl" text null,
  "sourceType" text null,
  "sourceId" text null,
  "sourceUrl" text null,
  source text null,
  constraint ads_ads_leads_pkey primary key (id)
) TABLESPACE pg_default;