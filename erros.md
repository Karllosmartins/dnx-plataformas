
   Generating static pages (7/31) 
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217

   Generating static pages (15/31) 
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217

   Generating static pages (23/31) 

 ✓ Generating static pages (31/31) 
   Finalizing page optimization ...
   Collecting build traces ...
Route (app)                              Size     First Load JS
┌ ○ /                                    4.92 kB         159 kB
├ ○ /_not-found                          880 B          88.8 kB
├ ○ /admin/planos                        3.15 kB         157 kB
├ ○ /admin/tipos-negocio                 10.5 kB         146 kB
├ ○ /agentes-ia                          7.67 kB         162 kB
├ λ /api/arquivos                        0 B                0 B
├ λ /api/arquivos/upload                 0 B                0 B
├ λ /api/datecode                        0 B                0 B
├ λ /api/datecode/consulta               0 B                0 B
├ λ /api/datecode/cpf                    0 B                0 B
├ λ /api/extracoes                       0 B                0 B
├ λ /api/extracoes/download              0 B                0 B
├ λ /api/oauth/google-calendar/callback  0 B                0 B
├ λ /api/profile-proxy                   0 B                0 B
├ λ /api/users/limits                    0 B                0 B
├ λ /api/vectorstores                    0 B                0 B
├ λ /api/vectorstores/files              0 B                0 B
├ λ /api/vectorstores/upload             0 B                0 B
├ λ /api/webhooks/evolution              0 B                0 B
├ λ /api/whatsapp/connect                0 B                0 B
├ λ /api/whatsapp/create-instance        0 B                0 B
├ λ /api/whatsapp/instances              0 B                0 B
├ λ /api/whatsapp/status                 0 B                0 B
├ ○ /arquivos                            3.31 kB         157 kB
├ ○ /configuracoes-admin                 14.6 kB         169 kB
├ ○ /consulta                            6.32 kB         160 kB
├ ○ /disparo-ia                          8.13 kB         162 kB
├ ○ /disparo-simples                     6.35 kB         160 kB
├ ○ /enriquecimento-api                  123 kB          277 kB
├ ○ /extracao-leads                      11.2 kB         281 kB
├ ○ /historico-contagens                 1.09 kB         159 kB
├ ○ /integracoes                         4.89 kB         159 kB
├ ○ /leads                               15.7 kB         281 kB
├ ○ /relatorios                          8.36 kB         274 kB
├ ○ /usuarios                            7.53 kB         161 kB
└ ○ /whatsapp                            6.29 kB         160 kB
+ First Load JS shared by all            87.9 kB
  ├ chunks/472-ceed697e056bc12d.js       32.5 kB
  ├ chunks/fd9d1056-053a427fed818d2b.js  53.3 kB
  ├ chunks/main-app-703e8bd9ded479e2.js  235 B
  └ chunks/webpack-63f5632c16a81393.js   1.84 kB
ƒ Middleware                             38.7 kB
○  (Static)   prerendered as static HTML
λ  (Dynamic)  server-rendered on demand using Node.js
Starting application...
> dnx-plataformas-crm@1.0.0 start

> next start
   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
 ⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
 ✓ Ready in 753ms
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
API Datecode Consulta: Dados recebidos: {
  document: '',
  tipoPessoa: 'PF',
  nomeRazao: '',
  cidade: '',

,
  cep: '',
  numeroEndereco: '',
  numeroTelefone: '62981048778',

  email: '',
  dataNascimentoAbertura: '',
  placaVeiculo: '',
  userId: '30'
}
Credenciais Datecode não encontradas para usuário 30, usando fallback do ambiente
Usando credenciais Datecode do ambiente (.env)
API Datecode Consulta: Credenciais disponíveis: { source: 'Database ou Environment', valid: true }
API Datecode Consulta: Enviando requisição: { numeroTelefone: '62981048778' }
API Datecode Consulta: Status da resposta: 400
API Datecode Consulta: Dados recebidos: {
  "errors": [
    "O campo tipoPessoa é obrigatório"
  ],
  "status": 400
}
API Datecode Consulta: Erro na consulta: {
  status: 400,
  data: { errors: [ 'O campo tipoPessoa é obrigatório' ], status: 400 }
}