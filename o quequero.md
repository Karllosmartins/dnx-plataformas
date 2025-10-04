  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
Installing dependencies...
npm warn deprecated @supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package instead.
npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package instead.
added 237 packages, and audited 238 packages in 18s
43 packages are looking for funding
  run `npm fund` for details
3 vulnerabilities (2 high, 1 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues possible, run:
  npm audit fix --force
Some issues need review, and may require choosing
a different dependency.
Run `npm audit` for details.
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.6.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.1
npm notice To update run: npm install -g npm@11.6.1
npm notice
Building application...
> dnx-plataformas-crm@1.0.0 build

> next build
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry
   ▲ Next.js 14.0.0
   Creating an optimized production build ...
 ⚠ Compiled with warnings
./node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js
A Node.js module is loaded ('url' at line 3) which is not supported in the Edge Runtime.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
Import trace for requested module:
./node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js
   Linting and checking validity of types ...
It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Installing dependencies
If you are not trying to use TypeScript, please remove the tsconfig.json file from your package root (and any TypeScript files in your pages directory).
Installing devDependencies (npm):

- typescript
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.1.7: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/config-array@0.11.14: Use @eslint/config-array instead
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated eslint@8.53.0: This version is no longer supported. Please see https://eslint.org/version-support for other options.
added 227 packages, and audited 465 packages in 9s
152 packages are looking for funding
  run `npm fund` for details
3 vulnerabilities (2 high, 1 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues possible, run:
  npm audit fix --force
Some issues need review, and may require choosing
a different dependency.
Run `npm audit` for details.
Failed to compile.
./app/relatorios/page.tsx:135:86
Type error: Property 'valor_negociacao' does not exist on type 'Lead'.
  133 |       const campanha = lead.nome_campanha || 'Sem campanha'
  134 |       campanhaCounts[campanha] = (campanhaCounts[campanha] || 0) + 1
> 135 |       campanhaValores[campanha] = (campanhaValores[campanha] || 0) + parseFloat(lead.valor_negociacao || '0')
      |                                                                                      ^
  136 |     })
  137 |
  138 |     // Métricas por origem