#!/bin/bash

# =====================================================
# SCRIPT DE BUILD E DEPLOY - DNX PLATAFORMAS CRM
# Para uso com Docker Swarm + Portainer
# =====================================================

echo "🔨 Fazendo build da imagem Docker..."

# Build da imagem
docker build -t dnx-plataformas-crm:latest .

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📦 Imagem criada: dnx-plataformas-crm:latest"
    echo ""
    echo "🚀 Agora você pode fazer o deploy no Portainer usando:"
    echo "   - Arquivo: docker-compose.portainer.yml"
    echo "   - A imagem dnx-plataformas-crm:latest está pronta"
    echo ""
    echo "💡 Ou execute o deploy direto:"
    echo "   docker stack deploy -c docker-compose.portainer.yml dnx-plataformas"
else
    echo "❌ Erro no build da imagem!"
    exit 1
fi