"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientsList } from "@/components/clients-list"
import { ClientForm } from "@/components/client-form"
import { SettingsManager } from "@/components/settings-manager"
import { JobsMonitor } from "@/components/automation/jobs-monitor"
import { useNavigationState } from "@/hooks/use-session-storage"
import { Users, CreditCard, AlertTriangle, DollarSign, Plus, Search, LogOut, Gamepad2, Settings, Cog } from "lucide-react"

export function Dashboard() {
  const { clients, logout } = useAuth()
  const { currentView, setCurrentView, searchTerm, setSearchTerm } = useNavigationState()

  const activeClients = clients.filter((c) => c.status === "Ativo").length
  const renewalPending = clients.filter((c) => c.status === "Precisa Renovar").length
  const totalClients = clients.length
  const estimatedRevenue = clients.filter((c) => c.status === "Ativo").length * 150 // Estimativa

  const pendingRenewalClients = clients.filter((c) => c.status === "Precisa Renovar")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nuvelon Cloud Gaming</h1>
              <p className="text-sm text-gray-500">Painel Administrativo</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center space-x-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex space-x-4">
          <Button
            variant={currentView === "dashboard" ? "default" : "ghost"}
            onClick={() => setCurrentView("dashboard")}
            className={currentView === "dashboard" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            Dashboard
          </Button>
          <Button
            variant={currentView === "clients" ? "default" : "ghost"}
            onClick={() => setCurrentView("clients")}
            className={currentView === "clients" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            Clientes
          </Button>
          <Button
            variant={currentView === "automation" ? "default" : "ghost"}
            onClick={() => setCurrentView("automation")}
            className={currentView === "automation" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Cog className="h-4 w-4 mr-2" />
            Automação
          </Button>
          <Button
            variant={currentView === "settings" ? "default" : "ghost"}
            onClick={() => setCurrentView("settings")}
            className={currentView === "settings" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </nav>

      <main className="p-6">
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Alertas */}
            {pendingRenewalClients.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Clientes com renovação pendente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingRenewalClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="font-medium">{client.name}</span>
                        <Badge variant="destructive">
                          Renovação: {new Date(client.renewalDate).toLocaleDateString("pt-BR")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClients}</div>
                  <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                  <p className="text-xs text-muted-foreground">Clientes ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Renovações Pendentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{renewalPending}</div>
                  <p className="text-xs text-muted-foreground">Precisam renovar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">R$ {estimatedRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>
            </div>

            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesse rapidamente as funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setCurrentView("add-client")} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentView("clients")}>
                    <Users className="h-4 w-4 mr-2" />
                    Ver Todos os Clientes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "clients" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lista de Clientes</h2>
              <Button onClick={() => setCurrentView("add-client")} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ClientsList searchTerm={searchTerm} />
          </div>
        )}

        {currentView === "add-client" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Adicionar Novo Cliente</h2>
              <Button variant="outline" onClick={() => setCurrentView("clients")}>
                Voltar para Lista
              </Button>
            </div>

            <ClientForm onSuccess={() => setCurrentView("clients")} />
          </div>
        )}

        {currentView === "settings" && (
          <div className="space-y-6">
            <SettingsManager />
          </div>
        )}

        {currentView === "automation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Monitor de Automação</h2>
            </div>
            <JobsMonitor />
          </div>
        )}
      </main>
    </div>
  )
}
