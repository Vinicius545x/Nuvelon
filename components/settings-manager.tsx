"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usePersistentSettings } from "@/hooks/use-persistent-state"
import { Trash2, Save, RotateCcw } from "lucide-react"

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoSave: boolean
  autoSaveInterval: number
  notifications: boolean
  emailNotifications: boolean
  language: 'pt-BR' | 'en-US'
  timezone: string
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
  currency: 'BRL' | 'USD' | 'EUR'
}

const defaultSettings: AppSettings = {
  theme: 'system',
  autoSave: true,
  autoSaveInterval: 30,
  notifications: true,
  emailNotifications: true,
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/MM/yyyy',
  currency: 'BRL'
}

export function SettingsManager() {
  const { toast } = useToast()
  const [settings, updateSetting, clearSettings] = usePersistentSettings<AppSettings>('nuvelon-settings', defaultSettings)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetSettings = async () => {
    setIsLoading(true)
    try {
      clearSettings()
      toast({
        title: "Configurações Resetadas",
        description: "Todas as configurações foram restauradas para os valores padrão",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao resetar configurações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'nuvelon-settings.json'
      link.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Configurações Exportadas",
        description: "Arquivo de configurações baixado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar configurações",
        variant: "destructive",
      })
    }
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        
        // Validar se as configurações importadas são válidas
        const validSettings = Object.keys(defaultSettings).reduce((acc, key) => {
          if (importedSettings[key] !== undefined) {
            acc[key as keyof AppSettings] = importedSettings[key]
          }
          return acc
        }, {} as Partial<AppSettings>)

        // Aplicar configurações válidas
        Object.entries(validSettings).forEach(([key, value]) => {
          updateSetting(key as keyof AppSettings, value)
        })

        toast({
          title: "Configurações Importadas",
          description: "Configurações importadas com sucesso",
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Arquivo de configurações inválido",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportSettings}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  updateSetting('theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={settings.language}
                onValueChange={(value: 'pt-BR' | 'en-US') => 
                  updateSetting('language', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Automação */}
        <Card>
          <CardHeader>
            <CardTitle>Automação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Salvamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Salvar alterações automaticamente
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            {settings.autoSave && (
              <div className="space-y-2">
                <Label htmlFor="autoSaveInterval">Intervalo de Salvamento (segundos)</Label>
                <Input
                  id="autoSaveInterval"
                  type="number"
                  min="5"
                  max="300"
                  value={settings.autoSaveInterval}
                  onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações do Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações do sistema
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Formatação */}
        <Card>
          <CardHeader>
            <CardTitle>Formatação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd') => 
                  updateSetting('dateFormat', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                  <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={settings.currency}
                onValueChange={(value: 'BRL' | 'USD' | 'EUR') => 
                  updateSetting('currency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSetting('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Importar Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="import-settings">Arquivo de Configurações (.json)</Label>
            <Input
              id="import-settings"
              type="file"
              accept=".json"
              onChange={handleImportSettings}
            />
            <p className="text-sm text-muted-foreground">
              Selecione um arquivo JSON com configurações para importar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 