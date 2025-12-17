'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (resetError) {
        setError(resetError.message || 'Erro ao enviar email de recuperação')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Image
              className="h-16 w-auto dark:hidden"
              src="/logo-preta.webp"
              alt="DNX Operações Inteligentes"
              width={200}
              height={64}
              priority
            />
            <Image
              className="h-16 w-auto hidden dark:block"
              src="/logo-branca.webp"
              alt="DNX Operações Inteligentes"
              width={200}
              height={64}
              priority
            />
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-xl text-center">Email enviado!</CardTitle>
              <CardDescription className="text-center">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                O link expira em 1 hora.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Não recebeu o email? Verifique a pasta de spam ou{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-primary hover:underline"
                >
                  tente novamente
                </button>
              </p>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            className="h-16 w-auto dark:hidden"
            src="/logo-preta.webp"
            alt="DNX Operações Inteligentes"
            width={200}
            height={64}
            priority
          />
          <Image
            className="h-16 w-auto hidden dark:block"
            src="/logo-branca.webp"
            alt="DNX Operações Inteligentes"
            width={200}
            height={64}
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Recuperar senha
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Digite seu email para receber o link de recuperação
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-muted p-3">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl text-center">Esqueceu sua senha?</CardTitle>
            <CardDescription className="text-center">
              Não se preocupe! Enviaremos um link para você criar uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>

              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
