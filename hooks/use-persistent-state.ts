import { useState, useEffect, useCallback } from 'react'

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Estado local
  const [state, setState] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const savedValue = localStorage.getItem(key)
      if (savedValue !== null) {
        const parsedValue = JSON.parse(savedValue)
        setState(parsedValue)
      }
    } catch (error) {
      console.error(`Erro ao carregar dados do localStorage para a chave "${key}":`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // Função para atualizar estado e salvar no localStorage
  const setPersistentState = useCallback((value: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value
      
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Erro ao salvar dados no localStorage para a chave "${key}":`, error)
      }
      
      return newValue
    })
  }, [key])

  // Função para limpar dados do localStorage
  const clearPersistentState = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setState(defaultValue)
    } catch (error) {
      console.error(`Erro ao limpar dados do localStorage para a chave "${key}":`, error)
    }
  }, [key, defaultValue])

  return [state, setPersistentState, clearPersistentState]
}

// Hook para gerenciar arrays persistentes
export function usePersistentArray<T>(
  key: string,
  defaultValue: T[] = []
): [T[], {
  add: (item: T) => void
  update: (index: number, item: T) => void
  remove: (index: number) => void
  clear: () => void
  set: (items: T[]) => void
}] {
  const [array, setArray, clearArray] = usePersistentState<T[]>(key, defaultValue)

  const add = useCallback((item: T) => {
    setArray(prev => [...prev, item])
  }, [setArray])

  const update = useCallback((index: number, item: T) => {
    setArray(prev => {
      const newArray = [...prev]
      newArray[index] = item
      return newArray
    })
  }, [setArray])

  const remove = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [setArray])

  const set = useCallback((items: T[]) => {
    setArray(items)
  }, [setArray])

  return [array, { add, update, remove, clear: clearArray, set }]
}

// Hook para gerenciar objetos persistentes
export function usePersistentObject<T extends Record<string, any>>(
  key: string,
  defaultValue: T
): [T, {
  update: (updates: Partial<T>) => void
  set: (value: T) => void
  clear: () => void
  reset: () => void
}] {
  const [object, setObject, clearObject] = usePersistentState<T>(key, defaultValue)

  const update = useCallback((updates: Partial<T>) => {
    setObject(prev => ({ ...prev, ...updates }))
  }, [setObject])

  const set = useCallback((value: T) => {
    setObject(value)
  }, [setObject])

  const reset = useCallback(() => {
    setObject(defaultValue)
  }, [setObject, defaultValue])

  return [object, { update, set, clear: clearObject, reset }]
}

// Hook para gerenciar configurações persistentes
export function usePersistentSettings<T extends Record<string, any>>(
  key: string,
  defaultSettings: T
): [T, (setting: keyof T, value: T[keyof T]) => void, () => void] {
  const [settings, setSettings, clearSettings] = usePersistentState<T>(key, defaultSettings)

  const updateSetting = useCallback((setting: keyof T, value: T[keyof T]) => {
    setSettings(prev => ({ ...prev, [setting]: value }))
  }, [setSettings])

  return [settings, updateSetting, clearSettings]
} 