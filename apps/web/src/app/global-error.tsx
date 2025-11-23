'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Erro</h1>
            <p className="mt-2">Algo deu errado</p>
            <button
              onClick={() => reset()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
