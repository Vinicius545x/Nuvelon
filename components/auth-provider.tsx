"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { LoadingIndicator } from "@/components/loading-indicator"

interface Client {
  id: string
  name: string
  plan: string
  purchaseDate: string
  renewalDate: string
  status: "Ativo" | "Precisa Renovar" | "Cancelado"
  notes: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clients: Client[]
  addClient: (client: Omit<Client, "id">) => void
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "João Silva",
    plan: "Mensal Premium",
    purchaseDate: "2024-11-01",
    renewalDate: "2024-12-01",
    status: "Ativo",
    notes: "Cliente VIP",
  },
  {
    id: "2",
    name: "Maria Santos",
    plan: "Trimestral Básico",
    purchaseDate: "2024-09-15",
    renewalDate: "2024-12-15",
    status: "Precisa Renovar",
    notes: "Primeira compra",
  },
  {
    id: "3",
    name: "Pedro Costa",
    plan: "Anual Pro",
    purchaseDate: "2024-01-10",
    renewalDate: "2025-01-10",
    status: "Ativo",
    notes: "Cliente fidelizado",
  },
  {
    id: "4",
    name: "Ana Oliveira",
    plan: "Mensal Básico",
    purchaseDate: "2024-10-01",
    renewalDate: "2024-11-01",
    status: "Precisa Renovar",
    notes: "Suporte técnico necessário",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      // Carregar estado de autenticação
      const auth = localStorage.getItem("nuvelon-auth")
      if (auth === "true") {
        setIsAuthenticated(true)
      }

      // Carregar clientes salvos
      const savedClients = localStorage.getItem("nuvelon-clients")
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients)
        setClients(parsedClients)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        localStorage.setItem("nuvelon-auth", "true")
        return true
      }
      return false
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setIsAuthenticated(false)
      localStorage.removeItem("nuvelon-auth")
    }
  }

  // Função para salvar clientes no localStorage
  const saveClientsToStorage = (clientsData: Client[]) => {
    try {
      localStorage.setItem("nuvelon-clients", JSON.stringify(clientsData))
    } catch (error) {
      console.error('Erro ao salvar clientes no localStorage:', error)
    }
  }

  const addClient = (clientData: Omit<Client, "id">) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
    }
    setClients((prev) => {
      const updatedClients = [...prev, newClient]
      saveClientsToStorage(updatedClients)
      return updatedClients
    })
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => {
      const updatedClients = prev.map((client) => 
        client.id === id ? { ...client, ...updates } : client
      )
      saveClientsToStorage(updatedClients)
      return updatedClients
    })
  }

  const deleteClient = (id: string) => {
    setClients((prev) => {
      const updatedClients = prev.filter((client) => client.id !== id)
      saveClientsToStorage(updatedClients)
      return updatedClients
    })
  }

  // Mostrar loading enquanto carrega dados iniciais
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingIndicator message="Carregando dados..." size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        clients,
        addClient,
        updateClient,
        deleteClient,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
