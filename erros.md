├ ○ /integracoes                         4.89 kB         154 kB
├ ○ /leads                               15.7 kB         276 kB
├ ○ /relatorios                          8.36 kB         269 kB
├ ○ /usuarios                            7.32 kB         156 kB
└ ○ /whatsapp                            6.29 kB         155 kB
+ First Load JS shared by all            87.9 kB
  ├ chunks/472-ceed697e056bc12d.js       32.5 kB
  ├ chunks/fd9d1056-053a427fed818d2b.js  53.3 kB
  ├ chunks/main-app-703e8bd9ded479e2.js  235 B
  └ chunks/webpack-1173247170c2c319.js   1.84 kB
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
 ✓ Ready in 719ms
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
[GET /api/arquivos] userId: 24 role: admin
[GET /api/arquivos] Admin - mostrando todos os arquivos
[GET /api/arquivos] Retornando 14 arquivos
(node:189) ExperimentalWarning: buffer.File is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Erro ao fazer upload: IncompleteBody: The request body was too small
    at throwDefaultError (/app/node_modules/@smithy/smithy-client/dist-cjs/index.js:287:22)
    at /app/node_modules/@smithy/smithy-client/dist-cjs/index.js:296:9
    at de_CommandError (/app/node_modules/@aws-sdk/client-s3/dist-cjs/index.js:4868:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async /app/node_modules/@smithy/middleware-serde/dist-cjs/index.js:8:24
    at async /app/node_modules/@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:386:20
    at async /app/node_modules/@smithy/middleware-retry/dist-cjs/index.js:254:46
    at async /app/node_modules/@aws-sdk/middleware-flexible-checksums/dist-cjs/index.js:247:20
    at async /app/node_modules/@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:63:28
    at async /app/node_modules/@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:90:20 {
  '$fault': 'client',
  '$response': HttpResponse {
    statusCode: 400,
    reason: '',
    headers: {
      server: 'nginx',
      date: 'Fri, 10 Oct 2025 17:49:02 GMT',
      'content-type': 'application/xml',
      'content-length': '159',
      connection: 'keep-alive',
      'x-amz-request-id': '7f9f9b29030ddd81',
      'x-amz-id-2': 'aYVFk3WTNZYxiymPrN0djJ2PiNX41lzNT',
      'cache-control': 'max-age=0, no-cache, no-store',
      'strict-transport-security': 'max-age=63072000'
    },
    body: IncomingMessage {
      _readableState: [ReadableState],
      _events: [Object: null prototype],
      _eventsCount: 2,
      _maxListeners: undefined,
      socket: null,
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      httpVersion: '1.1',
      complete: true,
      rawHeaders: [Array],
      rawTrailers: [],
      joinDuplicateHeaders: undefined,
      aborted: false,
      upgrade: false,
      url: '',
      method: null,
      statusCode: 400,
      statusMessage: '',
      client: [TLSSocket],
      _consuming: false,
      _dumped: false,
      req: [ClientRequest],
      [Symbol(kCapture)]: false,
      [Symbol(kHeaders)]: [Object],
      [Symbol(kHeadersCount)]: 18,
      [Symbol(kTrailers)]: null,
      [Symbol(kTrailersCount)]: 0
    }
  },
  '$retryable': undefined,
  '$metadata': {
    httpStatusCode: 400,
    requestId: '7f9f9b29030ddd81',
    extendedRequestId: 'aYVFk3WTNZYxiymPrN0djJ2PiNX41lzNT',
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  Code: 'IncompleteBody'
}