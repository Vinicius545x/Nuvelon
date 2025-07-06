# Sistema de Persistência - Nuvelon

## Visão Geral

O sistema de persistência do Nuvelon garante que as alterações feitas pelos usuários sejam salvas automaticamente e persistam entre sessões, proporcionando uma experiência de usuário fluida e confiável.

## Características Principais

### 1. Persistência Automática
- **Auto-save**: Dados são salvos automaticamente conforme o usuário digita
- **Intervalo configurável**: Tempo entre salvamentos pode ser ajustado nas configurações
- **Salvamento inteligente**: Evita salvamentos desnecessários

### 2. Múltiplas Camadas de Persistência
- **localStorage**: Para dados que devem persistir entre sessões
- **sessionStorage**: Para dados temporários da sessão atual
- **Estado em memória**: Para dados que não precisam ser persistidos

### 3. Recuperação de Dados
- **Carregamento automático**: Dados são restaurados automaticamente ao abrir a aplicação
- **Fallback seguro**: Se houver erro no carregamento, usa valores padrão
- **Indicadores visuais**: Mostra status de carregamento e salvamento

## Hooks de Persistência

### usePersistentState
Hook básico para persistir qualquer tipo de dado no localStorage.

```typescript
const [value, setValue, clearValue] = usePersistentState('key', defaultValue)
```

### usePersistentForm
Hook especializado para formulários com auto-save.

```typescript
const {
  formData,
  updateField,
  updateFields,
  resetForm,
  clearForm,
  isLoaded
} = usePersistentForm('form-key', initialData, {
  autoSave: true,
  autoSaveDelay: 500,
  clearOnSubmit: true
})
```

### usePersistentArray
Hook para gerenciar arrays persistentes.

```typescript
const [array, { add, update, remove, clear, set }] = usePersistentArray('array-key', [])
```

### usePersistentObject
Hook para gerenciar objetos persistentes.

```typescript
const [object, { update, set, clear, reset }] = usePersistentObject('object-key', defaultObject)
```

### usePersistentSettings
Hook para gerenciar configurações persistentes.

```typescript
const [settings, updateSetting, clearSettings] = usePersistentSettings('settings-key', defaultSettings)
```

### useSessionStorage
Hook para dados que devem persistir apenas na sessão atual.

```typescript
const [value, setValue, clearValue] = useSessionStorage('key', defaultValue)
```

### useNavigationState
Hook para persistir estado de navegação.

```typescript
const {
  currentView,
  setCurrentView,
  searchTerm,
  setSearchTerm,
  selectedClientId,
  setSelectedClientId,
  clearNavigationState
} = useNavigationState()
```

## Componentes de Persistência

### LoadingIndicator
Mostra indicadores de carregamento em diferentes contextos.

```typescript
<LoadingIndicator 
  message="Carregando dados..." 
  size="md" 
  variant="card" 
/>
```

### PersistenceNotification
Notifica o usuário sobre eventos de persistência.

```typescript
<PersistenceNotification
  type="auto-save"
  message="Dados salvos automaticamente"
  autoHide={true}
  autoHideDelay={3000}
/>
```

### SettingsManager
Interface para gerenciar configurações do sistema.

```typescript
<SettingsManager />
```

## Estrutura de Dados Persistidos

### localStorage
- `nuvelon-auth`: Estado de autenticação
- `nuvelon-clients`: Lista de clientes
- `nuvelon-settings`: Configurações do sistema
- `client-form-*`: Formulários de clientes
- `nuvelon-*`: Outros dados persistentes

### sessionStorage
- `nuvelon-current-view`: View atual do dashboard
- `nuvelon-search-term`: Termo de busca atual
- `nuvelon-selected-client`: Cliente selecionado
- `nuvelon-filters-*`: Filtros aplicados
- `nuvelon-pagination-*`: Estado de paginação

## Configurações de Persistência

### Auto-save
- **Habilitado por padrão**: true
- **Intervalo padrão**: 30 segundos
- **Intervalo mínimo**: 5 segundos
- **Intervalo máximo**: 300 segundos

### Notificações
- **Auto-save**: Notificação discreta
- **Draft saved**: Notificação de confirmação
- **Data loaded**: Notificação de carregamento
- **Error**: Notificação de erro

### Limpeza de Dados
- **Ao fazer logout**: Limpa dados de sessão
- **Ao submeter formulário**: Limpa rascunhos
- **Manual**: Botão para limpar dados

## Tratamento de Erros

### Erro de Armazenamento
- Log do erro no console
- Continua funcionando sem persistência
- Notifica o usuário sobre o problema

### Erro de Carregamento
- Usa valores padrão
- Log do erro no console
- Notifica o usuário sobre o problema

### Dados Corrompidos
- Validação de dados antes de usar
- Fallback para valores padrão
- Limpeza automática de dados inválidos

## Boas Práticas

### 1. Nomenclatura de Chaves
- Use prefixo `nuvelon-` para dados da aplicação
- Use nomes descritivos e consistentes
- Evite chaves muito longas

### 2. Tamanho dos Dados
- Evite salvar dados muito grandes
- Use compressão se necessário
- Limpe dados antigos regularmente

### 3. Performance
- Use debounce para auto-save
- Evite salvamentos frequentes
- Use lazy loading para dados grandes

### 4. Segurança
- Não salve dados sensíveis no localStorage
- Valide dados antes de salvar
- Limpe dados ao fazer logout

## Exemplos de Uso

### Formulário com Auto-save
```typescript
const {
  formData,
  updateField,
  isLoaded
} = usePersistentForm('client-form', initialData)

if (!isLoaded) {
  return <LoadingIndicator message="Carregando formulário..." />
}

return (
  <form>
    <input
      value={formData.name}
      onChange={(e) => updateField('name', e.target.value)}
    />
  </form>
)
```

### Configurações Persistentes
```typescript
const [settings, updateSetting] = usePersistentSettings('app-settings', {
  theme: 'light',
  language: 'pt-BR',
  autoSave: true
})

const handleThemeChange = (theme: string) => {
  updateSetting('theme', theme)
}
```

### Estado de Navegação
```typescript
const { currentView, setCurrentView } = useNavigationState()

return (
  <nav>
    <button onClick={() => setCurrentView('dashboard')}>
      Dashboard
    </button>
  </nav>
)
```

## Monitoramento e Debug

### Logs de Persistência
- Salvamentos bem-sucedidos
- Erros de salvamento
- Carregamentos bem-sucedidos
- Erros de carregamento

### Ferramentas de Debug
- Console logs detalhados
- Indicadores visuais de status
- Notificações de eventos

### Métricas
- Tempo de salvamento
- Tamanho dos dados
- Frequência de salvamento
- Taxa de erro

## Considerações Futuras

### Melhorias Planejadas
- Sincronização com servidor
- Backup automático
- Compressão de dados
- Criptografia local

### Recursos Adicionais
- Histórico de alterações
- Desfazer/Refazer
- Sincronização entre abas
- Backup/restore manual 