'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import LoginForm from '@/components/layout/LoginForm'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Se já estiver logado, redirecionar para home
    const user = authService.getCurrentUser()
    if (user) {
      router.push('/')
    }
  }, [router])

  const handleLogin = async (email: string, password: string) => {
    const { user, error } = await authService.signIn(email, password)

    if (user) {
      router.push('/')
      return { success: true }
    }

    return { success: false, error: error || 'Erro ao fazer login' }
  }

  return <LoginForm onLogin={handleLogin} />
}
