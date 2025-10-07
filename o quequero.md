Run `npm audit` for details.
   Collecting page data ...
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
   Generating static pages (0/30) ...
Erro no callback OAuth: ex [Error]: Dynamic server usage: Page couldn't be rendered statically because it used `nextUrl.searchParams`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at Object.eP [as staticGenerationBailout] (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:27402)
    at n (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:31301)
    at Object.get (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:31948)
    at GET (/app/.next/server/app/api/oauth/google-calendar/callback/route.js:1:533)
    at /app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:39529
    at /app/node_modules/next/dist/server/lib/trace/tracer.js:121:36
    at NoopContextManager.with (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7057)
    at ContextAPI.with (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:516)
    at NoopTracer.startActiveSpan (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18086)
    at ProxyTracer.startActiveSpan (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18847) {
  digest: 'DYNAMIC_SERVER_USAGE'
}

   Generating static pages (7/30) 
Erro na API de limites: ex [Error]: Dynamic server usage: Page couldn't be rendered statically because it used `request.url`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at Object.eP [as staticGenerationBailout] (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:27402)
    at i (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:32267)
    at Object.get (/app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:32363)
    at GET (/app/.next/server/app/api/users/limits/route.js:1:558)
    at /app/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:14:39529
    at /app/node_modules/next/dist/server/lib/trace/tracer.js:121:36
    at NoopContextManager.with (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7057)
    at ContextAPI.with (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:516)
    at NoopTracer.startActiveSpan (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18086)
    at ProxyTracer.startActiveSpan (/app/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18847) {
  digest: 'DYNAMIC_SERVER_USAGE'
}
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217

   Generating static pages (14/30) 
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217

   Generating static pages (22/30) 

 ✓ Generating static pages (30/30) 
   Finalizing page optimization ...
   Collecting build traces ...
Route (app)                              Size     First Load JS
┌ ○ /                                    5.04 kB         154 kB
├ ○ /_not-found                          880 B          88.8 kB
├ ○ /admin/planos                        3.13 kB         152 kB
├ ○ /admin/tipos-negocio                 10.5 kB         140 kB
├ ○ /agentes-ia                          7.78 kB         156 kB
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
├ ○ /configuracoes-admin                 14.6 kB         163 kB
├ ○ /consulta                            6.19 kB         155 kB
├ ○ /disparo-ia                          8.13 kB         157 kB
├ ○ /disparo-simples                     6.46 kB         155 kB
├ ○ /enriquecimento-api                  123 kB          271 kB
├ ○ /extracao-leads                      11.2 kB         276 kB
├ ○ /historico-contagens                 1.09 kB         154 kB
├ ○ /integracoes                         5 kB            153 kB
├ ○ /leads                               15.8 kB         276 kB
├ ○ /relatorios                          8.36 kB         269 kB
├ ○ /usuarios                            7.31 kB         156 kB
└ ○ /whatsapp                            6.29 kB         155 kB
+ First Load JS shared by all            87.9 kB
  ├ chunks/472-ceed697e056bc12d.js       32.5 kB
  ├ chunks/fd9d1056-053a427fed818d2b.js  53.3 kB
  ├ chunks/main-app-703e8bd9ded479e2.js  235 B
  └ chunks/webpack-197863ac1cf7480c.js   1.84 kB
ƒ Middleware                             36.8 kB
○  (Static)   prerendered as static HTML
λ  (Dynamic)  server-rendered on demand using Node.js
Starting application...
> dnx-plataformas-crm@1.0.0 start

> next start
   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
 ⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
 ✓ Ready in 722ms