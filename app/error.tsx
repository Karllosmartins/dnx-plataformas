'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">Erro</h1>
        <p className="mt-4 text-xl text-gray-600">Algo deu errado</p>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <div className="mt-6 space-x-4">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
