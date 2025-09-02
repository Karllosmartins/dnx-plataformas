import './globals.css'
import AuthWrapper from '../components/AuthWrapper'

export const metadata = {
  title: 'DNX Plataformas - CRM Limpa Nome',
  description: 'Sistema de CRM para recuperação de crédito e limpeza de nome',
  icons: {
    icon: '/sublogo.png',
    shortcut: '/sublogo.png',
    apple: '/sublogo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}