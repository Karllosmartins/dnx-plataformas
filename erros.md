Starting application...
> dnx-plataformas-crm@1.0.0 start

> next start
   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
 ⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
 ✓ Ready in 733ms
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217
[GET /api/arquivos] userId: 24 role: admin
[GET /api/arquivos] Retornando 6 arquivos do usuário 24
[Upload] Configuração B2: {
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  bucket: 'appdnxplataformas',
  hasKeyId: true,
  hasAppKey: true
}
(node:178) ExperimentalWarning: buffer.File is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
[Upload] Total de arquivos encontrados: 1
[Upload] Processando arquivo: Cora Bueno.png Tipo: image/png Tamanho: 2149060
[Upload] Uint8Array criado - Tamanho: 2149060 bytes
[Upload] Enviando para B2 - Key: cora/Cora_Bueno.png_1760121906275_xx1ml8 Body size: 2149060
[Upload] Erro detalhado ao enviar para B2: {
  message: 'The request body was too small',
  code: 'IncompleteBody',
  statusCode: 400,
  requestId: '86dd80e48f8886d1'
}
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
      date: 'Fri, 10 Oct 2025 18:45:07 GMT',
      'content-type': 'application/xml',
      'content-length': '159',
      connection: 'keep-alive',
      'x-amz-request-id': '86dd80e48f8886d1',
      'x-amz-id-2': 'aYSZkzmQOZSVi32OFN8FjGGOrNX018TP/',
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
    requestId: '86dd80e48f8886d1',
    extendedRequestId: 'aYSZkzmQOZSVi32OFN8FjGGOrNX018TP/',
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  Code: 'IncompleteBody'
}

{
  "nodes": [
    {
      "parameters": {
        "operation": "upload",
        "bucketName": "limpanome",
        "fileName": "=imagemdisparo-{{ $item(\"0\").$node[\"Disparo_wts_oficial\"].json[\"body\"][\"campanha\"] }}-{{ $item(\"0\").$node[\"Disparo_wts_oficial\"].json[\"body\"][\"usuario_id\"] }}-{{ $item(\"0\").$node[\"Disparo_wts_oficial\"].json[\"body\"][\"instancia\"] }}.jpeg",
        "binaryPropertyName": "image",
        "additionalFields": {
          "grantRead": false
        }
      },
      "type": "n8n-nodes-base.s3",
      "typeVersion": 1,
      "position": [
        -912,
        1136
      ],
      "id": "af53523d-35fd-4865-b708-160aa1d035bb",
      "name": "Upload a file",
      "credentials": {
        "s3": {
          "id": "U5j5vslpe1eutlNG",
          "name": "Backbaze limpanome"
        }
      }
    }
  ],
  "connections": {
    "Upload a file": {
      "main": [
        []
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "8a05fc78259df59f189257d963aa524f06c5b41879917b1259975ab664fbb533"
  }
}