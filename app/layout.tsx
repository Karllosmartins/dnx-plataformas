import './globals.css'
import AuthWrapper from '../components/shared/AuthWrapper'
import { ThemeProvider } from '../components/providers/theme-provider'

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
