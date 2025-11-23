import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{statusCode || 'Erro'}</h1>
        <p className="mt-2">
          {statusCode
            ? `Ocorreu um erro ${statusCode} no servidor`
            : 'Ocorreu um erro no cliente'}
        </p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar ao inicio
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
