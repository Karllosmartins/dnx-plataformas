'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie as configuracoes do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configuracoes do workspace atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integracoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure integracoes com WhatsApp, APIs externas, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos Personalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Crie campos customizados para seus leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gerencie usuarios e permissoes do workspace
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
