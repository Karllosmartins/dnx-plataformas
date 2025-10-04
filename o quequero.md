    "type-check": "tsc --noEmit",
    "deploy:build": "npm run lint && npm run type-check && npm run build",
    "deploy:start": "NODE_ENV=production npm start"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.3",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.38.4",
    "@tailwindcss/forms": "^0.5.7",
    "autoprefixer": "^10.4.16",
    "axios": "^1.6.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.292.0",
    "next": "14.0.0",
    "postcss": "^8.4.32",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "recharts": "^2.8.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^3.3.6",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "20.9.0",
    "@types/react": "18.2.37",
    "@types/react-dom": "18.2.15",
    "eslint": "8.53.0",
    "eslint-config-next": "14.0.0",
    "typescript": "5.2.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
Installing dependencies...
npm warn deprecated @supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package instead.
npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package instead.
added 237 packages, and audited 238 packages in 17s
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
Failed to compile.
./app/configuracoes-admin/components/TiposNegocioSection.tsx
Error: 
  x Unexpected token `div`. Expected jsx identifier
     ,-[/app/app/configuracoes-admin/components/TiposNegocioSection.tsx:334:1]
 334 |   }
 335 | 
 336 |   return (
 337 |     <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 col-span-full">
     :      ^^^
 338 |       <div className="space-y-4">
 339 |         <div className="flex items-center justify-between mb-4">
 340 |           <h3 className="font-semibold text-gray-900 flex items-center">
     `----
Caused by:
    Syntax Error
Import trace for requested module:
./app/configuracoes-admin/components/TiposNegocioSection.tsx
./app/configuracoes-admin/page.tsx
> Build failed because of webpack errors