#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY - DNX PLATAFORMAS CRM
# Deploy automatizado na VPS app.dnmarketing.com.br
# =====================================================

set -e  # Para o script se houver erro

echo "🚀 Iniciando deploy DNX Plataformas CRM..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado. Execute o script no diretório raiz do projeto."
    exit 1
fi

# 1. Verificar dependências
log_info "Verificando dependências..."

if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado"
    exit 1
fi

# 2. Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."

if [ ! -f ".env.production" ]; then
    log_warn "Arquivo .env.production não encontrado. Copiando de .env.example..."
    cp .env.example .env.production
    log_warn "⚠️  Configure as variáveis no arquivo .env.production antes de continuar!"
    exit 1
fi

# 3. Executar lint e type checking
log_info "Executando lint e verificação de tipos..."
npm run lint
npm run type-check

# 4. Fazer backup da aplicação atual (se existir)
log_info "Fazendo backup da versão atual..."
if docker ps | grep -q "dnx-plataformas"; then
    log_info "Parando aplicação atual..."
    docker-compose down
fi

# 5. Build da nova versão
log_info "Fazendo build da aplicação..."
npm run build

# 6. Build da imagem Docker
log_info "Construindo imagem Docker..."
docker-compose build --no-cache

# 7. Deploy da aplicação
log_info "Fazendo deploy da aplicação..."
docker-compose up -d

# 8. Aguardar aplicação inicializar
log_info "Aguardando aplicação inicializar..."
sleep 30

# 9. Verificar se a aplicação está rodando
log_info "Verificando se a aplicação está funcionando..."

if curl -f -s http://localhost:3000 > /dev/null; then
    log_info "✅ Aplicação está rodando localmente!"
else
    log_error "❌ Aplicação não está respondendo localmente"
    docker-compose logs
    exit 1
fi

# 10. Verificar logs
log_info "Verificando logs da aplicação..."
docker-compose logs --tail=50

# 11. Limpar recursos não utilizados
log_info "Limpando recursos Docker não utilizados..."
docker system prune -f

log_info "🎉 Deploy concluído com sucesso!"
log_info "📱 Aplicação disponível em: https://app.dnmarketing.com.br"
log_info ""
log_info "Comandos úteis:"
log_info "  docker-compose logs -f           # Ver logs em tempo real"
log_info "  docker-compose down              # Parar aplicação"
log_info "  docker-compose up -d             # Subir aplicação"
log_info "  docker-compose restart           # Reiniciar aplicação"