import { useState, useEffect, useCallback } from 'react'

// Hook para gerenciar dados na sessionStorage
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar dados da sessionStorage na inicialização
  useEffect(() => {
    try {
      const savedValue = sessionStorage.getItem(key)
      if (savedValue !== null) {
        const parsedValue = JSON.parse(savedValue)
        setState(parsedValue)
      }
    } catch (error) {
      console.error(`Erro ao carregar dados da sessionStorage para a chave "${key}":`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // Função para atualizar estado e salvar na sessionStorage
  const setSessionState = useCallback((value: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value
      
      try {
        sessionStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Erro ao salvar dados na sessionStorage para a chave "${key}":`, error)
      }
      
      return newValue
    })
  }, [key])

  // Função para limpar dados da sessionStorage
  const clearSessionState = useCallback(() => {
    try {
      sessionStorage.removeItem(key)
      setState(defaultValue)
    } catch (error) {
      console.error(`Erro ao limpar dados da sessionStorage para a chave "${key}":`, error)
    }
  }, [key, defaultValue])

  return [state, setSessionState, clearSessionState]
}

// Hook para gerenciar estado de navegação
export function useNavigationState() {
  const [currentView, setCurrentView, clearCurrentView] = useSessionStorage<string>('nuvelon-current-view', 'dashboard')
  const [searchTerm, setSearchTerm, clearSearchTerm] = useSessionStorage<string>('nuvelon-search-term', '')
  const [selectedClientId, setSelectedClientId, clearSelectedClientId] = useSessionStorage<string | null>('nuvelon-selected-client', null)

  const clearNavigationState = useCallback(() => {
    clearCurrentView()
    clearSearchTerm()
    clearSelectedClientId()
  }, [clearCurrentView, clearSearchTerm, clearSelectedClientId])

  return {
    currentView,
    setCurrentView,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    clearNavigationState
  }
}

// Hook para gerenciar estado de formulários de sessão
export function useSessionForm<T extends Record<string, any>>(
  formKey: string,
  initialData: T
) {
  const [formData, setFormData, clearFormData] = useSessionStorage<T>(formKey, initialData)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [setFormData])

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [setFormData])

  const resetForm = useCallback(() => {
    setFormData(initialData)
  }, [setFormData, initialData])

  return {
    formData,
    isLoaded,
    updateField,
    updateFields,
    setFormData,
    resetForm,
    clearFormData
  }
}

// Hook para gerenciar filtros de sessão
export function useSessionFilters<T extends Record<string, any>>(
  filterKey: string,
  defaultFilters: T
) {
  const [filters, setFilters, clearFilters] = useSessionStorage<T>(filterKey, defaultFilters)

  const updateFilter = useCallback((filter: keyof T, value: T[keyof T]) => {
    setFilters(prev => ({ ...prev, [filter]: value }))
  }, [setFilters])

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [setFilters])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [setFilters, defaultFilters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilters
  }
}

// Hook para gerenciar paginação de sessão
export function useSessionPagination(
  paginationKey: string,
  defaultPage: number = 1,
  defaultPageSize: number = 10
) {
  const [pagination, setPagination, clearPagination] = useSessionStorage<{
    page: number
    pageSize: number
  }>(paginationKey, {
    page: defaultPage,
    pageSize: defaultPageSize
  })

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [setPagination])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }))
  }, [setPagination])

  const resetPagination = useCallback(() => {
    setPagination({ page: defaultPage, pageSize: defaultPageSize })
  }, [setPagination, defaultPage, defaultPageSize])

  return {
    pagination,
    setPage,
    setPageSize,
    resetPagination,
    clearPagination
  }
}

// Hook para gerenciar ordenação de sessão
export function useSessionSorting(
  sortingKey: string,
  defaultSortBy: string = '',
  defaultSortOrder: 'asc' | 'desc' = 'asc'
) {
  const [sorting, setSorting, clearSorting] = useSessionStorage<{
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }>(sortingKey, {
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder
  })

  const setSortBy = useCallback((sortBy: string) => {
    setSorting(prev => ({ ...prev, sortBy }))
  }, [setSorting])

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setSorting(prev => ({ ...prev, sortOrder }))
  }, [setSorting])

  const toggleSortOrder = useCallback(() => {
    setSorting(prev => ({ 
      ...prev, 
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
    }))
  }, [setSorting])

  const resetSorting = useCallback(() => {
    setSorting({ sortBy: defaultSortBy, sortOrder: defaultSortOrder })
  }, [setSorting, defaultSortBy, defaultSortOrder])

  return {
    sorting,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    resetSorting,
    clearSorting
  }
} 