● Vou usar uma abordagem mais simples. Vou ler a seção das abas para encontrar o        
  problema:

● Read(app\consulta\page.tsx)
  ⎿  Read 15 lines

● Vou verificar o fechamento do conteúdo das abas. O problema é que há uma <div
  className="p-6"> aberta na linha 575 mas preciso verificar onde ela fecha:

● Bash(grep -n "</div>" "C:\Users\nilci\Documents\dnx_plataformas\dnx_recuperacao_credit
      o\app\consulta\page.tsx" | tail -10)
  ⎿ 592:                                <div><span className="font-medium text-gray     
    -700">Localização:</span> {pessoa.cidade}/{pessoa.uf}</div>
    594:                            </div>
    … +8 lines (ctrl+o to expand)


● Parece que está faltando um fechamento. Vou adicionar o fechamento correto após a     
  linha 634:

● Update(app\consulta\page.tsx)
  ⎿  Updated app\consulta\page.tsx with 1 addition
       632                        <p className="text-gray-500">Nenhum resultado
             encontrado</p>
       633                      </div>
       634                    )}
       635 +                </div>
       636                </div>
       637              )}
       638            </div>

● Perfeito! Agora vou testar o build novamente:

● Bash(cd "C:\Users\nilci\Documents\dnx_plataformas\dnx_recuperacao_credito" timeout: 3m 
       && npm run build 2>&1 | head -100)                                    0s

  ⎿  > dnx-plataformas-crm@1.0.0 build
     > next build
     … +153 lines (ctrl+o to expand)

● Excelente! O build passou com sucesso. Agora vou atualizar o TODO e fazer o
  commit:

● Bash(cd "C:\Users\nilci\Documents\dnx_plataformas\dnx_recuperacao_credito" && git add 
      -A && git commit -m "feat: melhorar interface de resultados de consulta com aba…) 
  ⎿ [main 75eec5a] feat: melhorar interface de resultados de consulta com abas orga     
    nizadas
     3 files changed, 1936 insertions(+), 358 deletions(-)
     create mode 100644 components/ConsultaResultados.tsx


● Bash(cd "C:\Users\nilci\Documents\dnx_plataformas\dnx_recuperacao_credito" && git     
      push)
  ⎿  To https://github.com/Karllosmartins/dnx-plataformas.git
        2a4504e..75eec5a  main -> main

● Perfeito! Terminei a implementação. Vou fazer um resumo do que foi feito:

  ✅ Implementação Concluída!

  Melhorei significativamente a interface de visualização de resultados da consulta     
  Datecode. Aqui está o que foi implementado:

  📊 Principais Melhorias:

  1. Novo Componente ConsultaResultados.tsx:
    - Componente separado e reutilizável para exibir resultados
    - 1000+ linhas de código bem organizado
    - Suporta todos os tipos de retorno da API Datecode
  2. Sistema de Abas Inteligente:
    - Dados Gerais: Informações principais (empresa ou pessoa)
    - Contatos: Telefones, endereços e e-mails organizados
    - Perfil (PF): Perfil sociodemográfico e de consumo
    - Participações (PF): Empresas vinculadas ao CPF
    - Sócios & Funcionários (PJ): Quadro societário e colaboradores
    - Veículos: Veículos registrados
  3. Detecção Automática de Tipo:
    - Lista Simples: Resultado de busca por telefone (múltiplas pessoas)
    - Pessoa Física: Dados completos de CPF
    - Pessoa Jurídica: Dados completos de CNPJ
  4. Visualizações Aprimoradas:
    - Cards com gradientes coloridos para dados principais
    - Badges de risco (Alto/Médio/Baixo) com cores apropriadas
    - Seções de restrições com ícones de check/x
    - Grid responsivo adaptável para mobile
    - Qualificação visual de telefones, endereços e emails
    - Botões "Ver Detalhes" para consulta rápida de sócios e empresas
  5. Perfil de Consumo:
    - Grid organizado com todos os indicadores
    - Cores diferentes para SIM/NÃO/Scores
    - Visualização clara de padrões de comportamento
  6. Perfil Sociodemográfico:
    - Classe social em destaque
    - Renda presumida
    - Ocupação e CBO
    - Score de risco
    - Descrição do segmento
  7. Código Otimizado:
    - Reduziu de 940 linhas para 642 linhas na página principal
    - Componente separado facilita manutenção
    - Build passou sem erros

  🎨 Experiência do Usuário:

  - Interface mais limpa e organizada
  - Navegação por abas facilita encontrar informações
  - Cores e badges ajudam a identificar rapidamente riscos e qualificações
  - Botões de "Ver Detalhes" permitem navegar entre CPFs/CNPJs relacionados
  - Responsivo para diferentes tamanhos de tela

  ✨ Resultado:

  Agora quando você fizer uma consulta, seja por telefone (lista simples), CPF ou       
  CNPJ, terá uma visualização profissional e organizada de todos os dados retornados    
   pela API Datecode, com fácil navegação entre as diferentes seções de informação!