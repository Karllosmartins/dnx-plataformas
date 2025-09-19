# INSTRUÇÕES PARA EXECUTAR AS MIGRAÇÕES

Para que o sistema de planos e enriquecimento funcione corretamente, você precisa executar as migrações no banco de dados:

## 1. Executar Migração do Sistema de Planos

Execute o arquivo `database/migration_sistema_planos_v2.sql` no seu banco Supabase:

```sql
-- Copie e cole todo o conteúdo do arquivo migration_sistema_planos_v2.sql
-- no SQL Editor do Supabase e execute
```

## 2. Funcionalidades Implementadas

### ✅ Sistema de Planos
- **Básico**: Dashboard CRM, WhatsApp, disparo simples
- **Premium 1**: Básico + Disparo IA + Agentes IA
- **Premium 2**: Básico + Extração de leads
- **Enterprise**: Tudo + Enriquecimento de dados

### ✅ Página de Configurações Administrativas
- `/configuracoes-admin` - Apenas para administradores
- Seções: Planos, Tipos de Negócio, Usuários
- Gerenciamento completo de planos e permissões

### ✅ Funcionalidade de Enriquecimento
- Aba no Disparo Simples para usuários Enterprise
- Upload de CSV com CNPJ + variáveis
- Sistema busca telefones automaticamente
- Interface visual diferenciada

## 3. Verificações Pós-Migração

Depois de executar a migração, verifique:

1. **Tabela `planos` criada** com os 4 planos padrão
2. **Coluna `plano_id` adicionada** na tabela `users`
3. **View `view_usuarios_planos` criada** para consultas
4. **Menu "Configurações"** aparece para administradores
5. **Aba "Enriquecimento"** aparece no Disparo Simples para Enterprise

## 4. Atribuir Planos aos Usuários

Use a página `/configuracoes-admin` para:
- Visualizar todos os usuários
- Alterar planos através do dropdown
- Criar/editar planos personalizados

## 5. Testar Enriquecimento

1. Defina um usuário como Enterprise
2. Acesse `/disparo-simples`
3. Veja a aba "Enriquecimento" roxa
4. Teste upload de CSV com CNPJ

---

**Nota**: Se algo não funcionar, verifique se a migração foi executada corretamente e se não há erros no console do navegador.