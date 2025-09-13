import './globals.css'
import AuthWrapper from '../components/AuthWrapper'

export const metadata = {
  title: 'DNX Operações Inteligentes',
  description: 'Sistema de CRM para múltiplos tipos de negócio',
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