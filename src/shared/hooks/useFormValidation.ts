import { useState, useCallback, useMemo } from 'react'

type ValidationRule = {
  required?: boolean
  email?: boolean
  minLength?: number
  maxLength?: number
  custom?: (value: string) => string | null
}

type FormRules<T> = Partial<Record<keyof T, ValidationRule>>

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  rules: FormRules<T>
): {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  setValue: (field: keyof T, value: string) => void
  validate: () => boolean
  isValid: boolean
  reset: () => void
} {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (field: keyof T, value: string): string | undefined => {
      const fieldRules = rules[field]
      if (!fieldRules) return undefined

      // Required validation
      if (fieldRules.required && !value) {
        return 'This field is required'
      }

      // Email validation
      if (fieldRules.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email'
        }
      }

      // MinLength validation
      if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
        return `Minimum length is ${fieldRules.minLength}`
      }

      // MaxLength validation
      if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
        return `Maximum length is ${fieldRules.maxLength}`
      }

      // Custom validation
      if (fieldRules.custom) {
        const customError = fieldRules.custom(value)
        if (customError) {
          return customError
        }
      }

      return undefined
    },
    [rules]
  )

  const setValue = useCallback(
    (field: keyof T, value: string) => {
      setValues((prev) => ({
        ...prev,
        [field]: value
      }))

      setTouched((prev) => ({
        ...prev,
        [field]: true
      }))

      // Validate field immediately
      const error = validateField(field, value)
      setErrors((prev) => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[field] = error
        } else {
          delete newErrors[field]
        }
        return newErrors
      })
    },
    [validateField]
  )

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    for (const field in values) {
      const error = validateField(field as keyof T, values[field])
      if (error) {
        newErrors[field as keyof T] = error
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [values, validateField])

  const isValid = useMemo(() => {
    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      return false
    }

    // Check if all required fields have values
    for (const field in rules) {
      const fieldRules = rules[field]
      if (fieldRules?.required && !values[field]) {
        return false
      }
    }

    return true
  }, [errors, rules, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    validate,
    isValid,
    reset
  }
}