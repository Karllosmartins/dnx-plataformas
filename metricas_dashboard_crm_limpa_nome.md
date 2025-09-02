# CRM e Dashboard - Limpa Nome (Versão Prática)

## 1. ESTÁGIOS DO CRM

### 1.1 Novo Lead
- Cliente fez primeiro contato
- **Campos**: Nome, CPF, Telefone, Origem

### 1.2 Qualificação
- Confirmou negativação e interesse
- **Campos**: Valor estimado da dívida, Tempo negativado, Tipo consulta interesse

### 1.3 Desqualificado
- Não atende critérios mínimos
- **Campos**: Motivo desqualificação

### 1.4 Pagamento Consulta
- Cliente pagou R$ 30 ou R$ 199
- **Campos**: Valor pago, Data pagamento, Link pagamento

### 1.5 Não Consta Dívida
- Consulta não encontrou negativação
- **Campos**: Data consulta, Observações

### 1.6 Consta Dívida
- Consulta encontrou dívidas
- **Campos**: Valor total dívidas, Órgãos negativados, Link relatório

### 1.7 Enviado para Negociação
- Escalado para atendimento humano
- **Campos**: Data escalação, Vendedor responsável

### 1.8 Cliente Fechado
- Contrato assinado e pago
- **Campos**: Valor contrato, Data fechamento

## 2. CAMPOS PRINCIPAIS DO LEAD

### 2.1 Dados Básicos
- **Nome**
- **CPF**
- **Telefone**
- **Origem** (WhatsApp, Site, Indicação, etc.)

### 2.2 Dados Financeiros
- **Valor da Dívida** (estimado e depois real)
- **Valor Pago Consulta** (R$ 30 ou R$ 199)
- **Valor Contrato** (se fechou)
- **Link Pagamento** (PIX gerado)

### 2.3 Status e Links
- **Status Atual** (estágio atual)
- **Data Última Atividade**
- **Link do Relatório** (após consulta)
- **Vendedor Responsável** (se escalado)

## 3. DASHBOARD PRINCIPAL

### 3.1 Funil de Conversão (%)
- **Novo Lead → Qualificação**: __%
- **Qualificação → Pagamento Consulta**: __%  
- **Pagamento → Dívida Encontrada**: __%
- **Dívida Encontrada → Cliente Fechado**: __%

### 3.2 Métricas Financeiras
- **Total Consultas Pagas**: R$ ___
- **Receita Contratos**: R$ ___
- **Ticket Médio**: R$ ___
- **Meta Mensal**: R$ ___

### 3.3 Métricas Operacionais
- **Total Leads**: ___
- **Leads Qualificados**: ___
- **Consultas Pagas**: ___
- **Contratos Fechados**: ___

### 3.4 Produtos/Serviços
- **Consulta Básica (R$ 30)**: ___ vendas
- **Consulta Rating (R$ 199)**: ___ vendas  
- **Limpa Nome**: ___ contratos
- **Ticket Médio por Produto**: R$ ___