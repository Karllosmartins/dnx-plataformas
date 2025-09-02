# Deploy no Portainer - DNX Plataformas CRM

## Pré-requisitos

1. **Portainer** instalado e configurado
2. **Docker** e **Docker Compose** funcionando
3. **Traefik** configurado (se usar proxy reverso)
4. **Domínio** app.dnxplataformas.com.br apontando para o servidor

## Como fazer o Deploy

### **⚠️ IMPORTANTE: Build da imagem primeiro**

Como o Docker Swarm não suporta `build`, você precisa fazer o build da imagem antes:

#### **Opção 1: Script automático**
```bash
# Linux/Mac
./build-and-deploy.sh

# Windows
build-and-deploy.bat
```

#### **Opção 2: Manual**
```bash
docker build -t dnx-plataformas-crm:latest .
```

### 1. Via Portainer UI (Recomendado)

1. **Execute o build** da imagem primeiro (opções acima)
2. Acesse o Portainer
3. Vá em **Stacks** → **Add Stack**
4. Nomeie como `dnx-plataformas-crm`
5. Cole o conteúdo do arquivo `docker-compose.portainer.yml`
6. Clique em **Deploy the stack**

### 2. Via Git Repository

1. No Portainer, vá em **Stacks** → **Add Stack**
2. Selecione **Repository** como fonte
3. Insira a URL do repositório Git
4. Defina o compose file: `docker-compose.portainer.yml`
5. Configure as variáveis de ambiente
6. Deploy automático habilitado

## Variáveis de Ambiente Obrigatórias

Configure no Portainer antes do deploy:

```bash
# Aplicação
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Supabase (substitua pelos valores reais)
NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# URLs do Sistema
FRONTEND_URL=https://app.dnxplataformas.com.br
API_URL=https://app.dnxplataformas.com.br/api
NEXTAUTH_URL=https://app.dnxplataformas.com.br

# Segurança
NEXTAUTH_SECRET=sua_chave_secreta_muito_segura
ENCRYPTION_KEY=sua_chave_de_criptografia_super_secreta
```

## Configuração de Rede

### Com Traefik (Recomendado)
- A stack usará as labels do Traefik
- Certificado SSL automático via Let's Encrypt
- Acesso via: https://app.dnxplataformas.com.br

### Sem Traefik (Porta Direta)
- Remova as labels do Traefik no docker-compose
- Configure proxy reverso no servidor (nginx/apache)
- Ou acesse via IP:3000

## Monitoramento

### Logs da Aplicação
```bash
# Via Portainer UI
Containers → dnx-plataformas-crm → Logs

# Via Docker CLI
docker logs dnx-plataformas-crm -f
```

### Health Check
```bash
# Verificar se a aplicação está rodando
curl -f http://localhost:3000/api/health || exit 1
```

## Troubleshooting

### Build Falhou
- Verificar se o Node.js 18+ está disponível
- Conferir se todas as dependências estão no package.json
- Verificar logs de build no Portainer

### Container não inicia
- Verificar variáveis de ambiente
- Conferir logs do container
- Validar configuração do banco (Supabase)

### Não acessa pelo domínio
- Verificar DNS do domínio
- Confirmar configuração do Traefik
- Validar certificado SSL

## Backup e Restore

### Backup dos Dados
```bash
# Backup das configurações
docker-compose -f docker-compose.portainer.yml config > backup-config.yml

# Backup dos volumes (se houver)
docker run --rm -v dnx-plataformas-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

### Rollback
```bash
# Reverter para versão anterior
docker-compose -f docker-compose.portainer.yml down
docker-compose -f docker-compose.portainer.yml pull
docker-compose -f docker-compose.portainer.yml up -d
```

## Atualizações

1. Push do código para o repositório
2. No Portainer: Stack → dnx-plataformas-crm → Update
3. Marcar **Re-pull image** se necessário
4. Clicar em **Update the stack**

---

**Domínio:** app.dnxplataformas.com.br  
**Porta Interna:** 3000  
**SSL:** Automático via Let's Encrypt  
**Logs:** Disponíveis via Portainer UI