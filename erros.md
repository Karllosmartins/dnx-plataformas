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
  constraint leads_pkey primary key (id),
  constraint leads_tipo_negocio_id_fkey foreign KEY (tipo_negocio_id) references tipos_negocio (id),
  constraint leads_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
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

create index IF not exists idx_leads_tipo_negocio_id on public.leads using btree (tipo_negocio_id) TABLESPACE pg_default;

create index IF not exists idx_leads_dados_personalizados on public.leads using gin (dados_personalizados) TABLESPACE pg_default;

create index IF not exists idx_leads_status_generico on public.leads using btree (status_generico) TABLESPACE pg_default;

create index IF not exists idx_leads_user_tipo on public.leads using btree (user_id, tipo_negocio_id) TABLESPACE pg_default;

create trigger update_leads_updated_at BEFORE
update on leads for EACH row
execute FUNCTION update_updated_at_column (); 



dados preenchidos na tabelas leads e negocios pra você entender porque pra mim a fase 4 não faz sentido:
leads: 
[{"idx":26,"id":774,"user_id":28,"created_at":"2025-10-08 00:00:00","remotejid":"556281048778@s.whatsapp.net","response_id":"resp_0d6b0b67a9e244710068f38148dba4819d80f2fbf0f230dad6","atendimentofinalizado":false,"conversation_log":"[]","times_tamp":"18-10-2025 09:00","tokens":8552,"user_lastinteraction":"2025-10-08T16:20:19.032-03:00","bot_lastinteraction":"2025-10-08T16:20:19.032-03:00","lead_id":null,"contact_id":null,"numero_formatado":"556281048778","email_usuario":null,"task_id":null,"site_usuario":null,"link_meet":null,"numero_follow":null,"instance":"leonardo-liderseg","nome_cliente":"Dyanderson Karllos","id_calendar":null,"data_agendamento":null,"hora_agendamento":null,"Agente_ID":"3","data_folowup_solicitado":null,"folowup_solicitado":false,"id_card":null,"existe_whatsapp":true,"responsavel_encontrado":false,"falando_com_responsavel":false,"efetuar_disparo":null,"nome_empresa":null,"id_empresa":null,"nome_campanha":null,"cpf_cnpj":null,"telefone":"556281048778","origem":"whatsapp","status_limpa_nome":"novo_lead","valor_estimado_divida":null,"valor_real_divida":null,"valor_pago_consulta":null,"valor_contrato":null,"tempo_negativado":null,"tipo_consulta_interesse":null,"motivo_desqualificacao":null,"data_pagamento":null,"link_pagamento":null,"data_consulta":null,"orgaos_negativados":null,"link_relatorio":null,"observacoes_limpa_nome":null,"data_escalacao":null,"vendedor_responsavel":null,"data_fechamento":null,"data_ultima_atividade":"2025-10-08 19:19:48.359414+00","updated_at":"2025-10-18 12:00:33.85767+00","status_disparo":null,"tipo_negocio_id":2,"dados_personalizados":"{\"tipo_acidente\": \"\", \"contrato_assinado\": false, \"beneficios_interesse\": \"\"}","status_generico":"novo_caso"}]

[{"idx":20,"id":734,"user_id":31,"created_at":"2025-10-05 12:54:12.094775","remotejid":"","response_id":null,"atendimentofinalizado":false,"conversation_log":"[]","times_tamp":"","tokens":0,"user_lastinteraction":null,"bot_lastinteraction":null,"lead_id":null,"contact_id":null,"numero_formatado":null,"email_usuario":null,"task_id":null,"site_usuario":null,"link_meet":null,"numero_follow":null,"instance":null,"nome_cliente":"Cliente teste 1","id_calendar":null,"data_agendamento":null,"hora_agendamento":null,"Agente_ID":"1","data_folowup_solicitado":null,"folowup_solicitado":false,"id_card":null,"existe_whatsapp":null,"responsavel_encontrado":false,"falando_com_responsavel":false,"efetuar_disparo":null,"nome_empresa":"Cliente teste 1","id_empresa":null,"nome_campanha":null,"cpf_cnpj":"01010101010101","telefone":"62985654896","origem":"WhatsApp","status_limpa_nome":null,"valor_estimado_divida":null,"valor_real_divida":null,"valor_pago_consulta":null,"valor_contrato":null,"tempo_negativado":null,"tipo_consulta_interesse":null,"motivo_desqualificacao":null,"data_pagamento":null,"link_pagamento":null,"data_consulta":null,"orgaos_negativados":null,"link_relatorio":null,"observacoes_limpa_nome":null,"data_escalacao":null,"vendedor_responsavel":null,"data_fechamento":null,"data_ultima_atividade":"2025-10-05 12:54:12.094775+00","updated_at":"2025-10-05 18:11:55.992524+00","status_disparo":null,"tipo_negocio_id":3,"dados_personalizados":"{\"tipo_servico\": \"Prospecção\", \"porte_empresa\": \"pequena\", \"segmento_empresa\": \"varejo\"}","status_generico":"contato_decisor"},{"idx":26,"id":774,"user_id":28,"created_at":"2025-10-08 00:00:00","remotejid":"556281048778@s.whatsapp.net","response_id":"resp_0d6b0b67a9e244710068f38148dba4819d80f2fbf0f230dad6","atendimentofinalizado":false,"conversation_log":"[]","times_tamp":"18-10-2025 09:00","tokens":8552,"user_lastinteraction":"2025-10-08T16:20:19.032-03:00","bot_lastinteraction":"2025-10-08T16:20:19.032-03:00","lead_id":null,"contact_id":null,"numero_formatado":"556281048778","email_usuario":null,"task_id":null,"site_usuario":null,"link_meet":null,"numero_follow":null,"instance":"leonardo-liderseg","nome_cliente":"Dyanderson Karllos","id_calendar":null,"data_agendamento":null,"hora_agendamento":null,"Agente_ID":"3","data_folowup_solicitado":null,"folowup_solicitado":false,"id_card":null,"existe_whatsapp":true,"responsavel_encontrado":false,"falando_com_responsavel":false,"efetuar_disparo":null,"nome_empresa":null,"id_empresa":null,"nome_campanha":null,"cpf_cnpj":null,"telefone":"556281048778","origem":"whatsapp","status_limpa_nome":"novo_lead","valor_estimado_divida":null,"valor_real_divida":null,"valor_pago_consulta":null,"valor_contrato":null,"tempo_negativado":null,"tipo_consulta_interesse":null,"motivo_desqualificacao":null,"data_pagamento":null,"link_pagamento":null,"data_consulta":null,"orgaos_negativados":null,"link_relatorio":null,"observacoes_limpa_nome":null,"data_escalacao":null,"vendedor_responsavel":null,"data_fechamento":null,"data_ultima_atividade":"2025-10-08 19:19:48.359414+00","updated_at":"2025-10-18 12:00:33.85767+00","status_disparo":null,"tipo_negocio_id":2,"dados_personalizados":"{\"tipo_acidente\": \"\", \"contrato_assinado\": false, \"beneficios_interesse\": \"\"}","status_generico":"novo_caso"}]