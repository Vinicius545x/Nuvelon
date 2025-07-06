import { useState, useEffect, useCallback } from 'react'

interface FormData {
  [key: string]: any
}

interface UsePersistentFormOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  clearOnSubmit?: boolean
}

export function usePersistentForm<T extends FormData>(
  formKey: string,
  initialData: T,
  options: UsePersistentFormOptions = {}
) {
  const {
    autoSave = true,
    autoSaveDelay = 1000,
    clearOnSubmit = true
  } = options

  const [formData, setFormData] = useState<T>(initialData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // Carregar dados salvos na inicialização
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(formKey)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
      }
    } catch (error) {
      console.error(`Erro ao carregar formulário do localStorage para "${formKey}":`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [formKey])

  // Função para salvar dados no localStorage
  const saveToStorage = useCallback((data: T) => {
    try {
      localStorage.setItem(formKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Erro ao salvar formulário no localStorage para "${formKey}":`, error)
    }
  }, [formKey])

  // Função para limpar dados do localStorage
  const clearFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(formKey)
    } catch (error) {
      console.error(`Erro ao limpar formulário do localStorage para "${formKey}":`, error)
    }
  }, [formKey])

  // Função para atualizar campo específico
  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      if (autoSave) {
        // Cancelar timer anterior
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
        }
        
        // Configurar novo timer
        const timer = setTimeout(() => {
          saveToStorage(newData)
        }, autoSaveDelay)
        
        setAutoSaveTimer(timer)
      }
      
      return newData
    })
  }, [autoSave, autoSaveDelay, autoSaveTimer, saveToStorage])

  // Função para atualizar múltiplos campos
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates }
      
      if (autoSave) {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
        }
        
        const timer = setTimeout(() => {
          saveToStorage(newData)
        }, autoSaveDelay)
        
        setAutoSaveTimer(timer)
      }
      
      return newData
    })
  }, [autoSave, autoSaveDelay, autoSaveTimer, saveToStorage])

  // Função para definir dados completos
  const setFormDataDirect = useCallback((data: T) => {
    setFormData(data)
    if (autoSave) {
      saveToStorage(data)
    }
  }, [autoSave, saveToStorage])

  // Função para resetar formulário
  const resetForm = useCallback(() => {
    setFormData(initialData)
    clearFromStorage()
  }, [initialData, clearFromStorage])

  // Função para limpar formulário
  const clearForm = useCallback(() => {
    setFormData({} as T)
    clearFromStorage()
  }, [clearFromStorage])

  // Função para submeter formulário
  const submitForm = useCallback((onSubmit: (data: T) => void | Promise<void>) => {
    return async () => {
      try {
        await onSubmit(formData)
        
        if (clearOnSubmit) {
          clearForm()
        }
      } catch (error) {
        console.error('Erro ao submeter formulário:', error)
        throw error
      }
    }
  }, [formData, clearOnSubmit, clearForm])

  // Limpar timer quando componente for desmontado
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [autoSaveTimer])

  return {
    formData,
    isLoaded,
    updateField,
    updateFields,
    setFormData: setFormDataDirect,
    resetForm,
    clearForm,
    submitForm,
    saveToStorage,
    clearFromStorage
  }
}

// Hook para gerenciar formulários com validação
export function usePersistentFormWithValidation<T extends FormData>(
  formKey: string,
  initialData: T,
  validationSchema?: any,
  options: UsePersistentFormOptions = {}
) {
  const form = usePersistentForm(formKey, initialData, options)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isValidating, setIsValidating] = useState(false)

  // Função para validar campo específico
  const validateField = useCallback(async (field: keyof T, value: T[keyof T]) => {
    if (!validationSchema) return true

    try {
      setIsValidating(true)
      await validationSchema.validateAt(field as string, { [field]: value })
      
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      return true
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        [field]: error.message
      }))
      return false
    } finally {
      setIsValidating(false)
    }
  }, [validationSchema])

  // Função para validar formulário completo
  const validateForm = useCallback(async () => {
    if (!validationSchema) return true

    try {
      setIsValidating(true)
      await validationSchema.validate(form.formData, { abortEarly: false })
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Partial<Record<keyof T, string>> = {}
      
      if (error.inner) {
        error.inner.forEach((err: any) => {
          newErrors[err.path as keyof T] = err.message
        })
      }
      
      setErrors(newErrors)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [validationSchema, form.formData])

  // Função para atualizar campo com validação
  const updateFieldWithValidation = useCallback(async (field: keyof T, value: T[keyof T]) => {
    form.updateField(field, value)
    
    if (validationSchema) {
      await validateField(field, value)
    }
  }, [form, validationSchema, validateField])

  // Função para submeter com validação
  const submitFormWithValidation = useCallback((onSubmit: (data: T) => void | Promise<void>) => {
    return async () => {
      const isValid = await validateForm()
      
      if (isValid) {
        await form.submitForm(onSubmit)()
      }
    }
  }, [validateForm, form])

  return {
    ...form,
    errors,
    isValidating,
    validateField,
    validateForm,
    updateField: updateFieldWithValidation,
    submitForm: submitFormWithValidation,
    hasErrors: Object.keys(errors).length > 0
  }
} 