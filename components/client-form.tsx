"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { usePersistentForm } from "@/hooks/use-persistent-form"

interface Client {
  id: string
  name: string
  plan: string
  purchaseDate: string
  renewalDate: string
  status: "Ativo" | "Precisa Renovar" | "Cancelado"
  notes: string
}

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
}

const PLANS = [
  { value: "Mensal Básico", label: "Mensal Básico", months: 1 },
  { value: "Mensal Premium", label: "Mensal Premium", months: 1 },
  { value: "Trimestral Básico", label: "Trimestral Básico", months: 3 },
  { value: "Trimestral Premium", label: "Trimestral Premium", months: 3 },
  { value: "Anual Básico", label: "Anual Básico", months: 12 },
  { value: "Anual Pro", label: "Anual Pro", months: 12 },
]

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { addClient, updateClient } = useAuth()
  const { toast } = useToast()
  
  // Usar formulário persistente
  const formKey = client ? `client-form-${client.id}` : 'client-form-new'
  const initialData = {
    name: client?.name || "",
    plan: client?.plan || "",
    purchaseDate: client?.purchaseDate || "",
    status: client?.status || ("Ativo" as const),
    notes: client?.notes || "",
  }
  
  const {
    formData,
    updateField,
    updateFields,
    resetForm,
    clearForm,
    isLoaded,
    saveToStorage
  } = usePersistentForm(formKey, initialData, {
    autoSave: true,
    autoSaveDelay: 500,
    clearOnSubmit: true
  })
  
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    client?.purchaseDate ? new Date(client.purchaseDate) : undefined,
  )
  
  // Sincronizar data de compra com o formulário persistente
  useEffect(() => {
    if (purchaseDate) {
      updateField('purchaseDate', purchaseDate.toISOString().split('T')[0])
    }
  }, [purchaseDate, updateField])
  
  // Carregar data de compra do formulário persistente
  useEffect(() => {
    if (isLoaded && formData.purchaseDate) {
      setPurchaseDate(new Date(formData.purchaseDate))
    }
  }, [isLoaded, formData.purchaseDate])

  const calculateRenewalDate = (purchaseDate: Date, plan: string): string => {
    const selectedPlan = PLANS.find((p) => p.value === plan)
    if (!selectedPlan) return purchaseDate.toISOString().split("T")[0]

    const renewalDate = new Date(purchaseDate)
    renewalDate.setMonth(renewalDate.getMonth() + selectedPlan.months)
    return renewalDate.toISOString().split("T")[0]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!purchaseDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a data de compra",
        variant: "destructive",
      })
      return
    }

    const purchaseDateStr = purchaseDate.toISOString().split("T")[0]
    const renewalDate = calculateRenewalDate(purchaseDate, formData.plan)

    const clientData = {
      ...formData,
      purchaseDate: purchaseDateStr,
      renewalDate,
    }

    if (client) {
      updateClient(client.id, clientData)
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      })
    } else {
      addClient(clientData)
      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      })
    }

    // Limpar formulário após sucesso
    clearForm()
    onSuccess()
  }
  
  const handleSaveDraft = () => {
    saveToStorage(formData)
    toast({
      title: "Rascunho Salvo",
      description: "Seus dados foram salvos automaticamente",
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{client ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cliente *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano Contratado *</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) => updateField('plan', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Compra *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Atual</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Ativo" | "Precisa Renovar" | "Cancelado") =>
                  updateField('status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Precisa Renovar">Precisa Renovar</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Adicione observações sobre o cliente (opcional)"
              rows={3}
            />
          </div>

          {purchaseDate && formData.plan && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">Informações Calculadas</h4>
              <p className="text-sm text-purple-700">
                <strong>Data de Renovação:</strong>{" "}
                {format(new Date(calculateRenewalDate(purchaseDate, formData.plan)), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {client ? "Atualizar Cliente" : "Adicionar Cliente"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Rascunho
            </Button>
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
