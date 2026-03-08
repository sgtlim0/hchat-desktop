import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../useFormValidation'

describe('useFormValidation', () => {
  const initialValues = {
    email: '',
    password: '',
    username: 'john'
  }

  const rules = {
    email: {
      required: true,
      email: true
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 20
    },
    username: {
      minLength: 3,
      custom: (value: string) => {
        if (value.includes(' ')) {
          return 'Username cannot contain spaces'
        }
        return null
      }
    }
  }

  it('returns initial values', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isValid).toBe(false) // Required fields are empty
  })

  it('updates field value', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    act(() => {
      result.current.setValue('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.touched.email).toBe(true)
  })

  it('validates required field', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    act(() => {
      result.current.setValue('email', '')
    })

    act(() => {
      result.current.validate()
    })

    expect(result.current.errors.email).toBe('This field is required')
    expect(result.current.isValid).toBe(false)
  })

  it('shows error for invalid email', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    act(() => {
      result.current.setValue('email', 'invalid-email')
    })

    expect(result.current.errors.email).toBe('Please enter a valid email')
    expect(result.current.isValid).toBe(false)

    act(() => {
      result.current.setValue('email', 'valid@email.com')
    })

    expect(result.current.errors.email).toBeUndefined()
  })

  it('clears errors on valid input', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // First set invalid value
    act(() => {
      result.current.setValue('password', 'short')
    })

    expect(result.current.errors.password).toBe('Minimum length is 8')

    // Now set valid value
    act(() => {
      result.current.setValue('password', 'validpassword123')
    })

    expect(result.current.errors.password).toBeUndefined()
  })

  it('isValid returns true when all valid', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Initially false due to required fields
    expect(result.current.isValid).toBe(false)

    // Fill in required fields with valid values
    act(() => {
      result.current.setValue('email', 'test@example.com')
    })

    act(() => {
      result.current.setValue('password', 'password123')
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.errors).toEqual({})
  })

  it('reset restores initial values', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Modify values
    act(() => {
      result.current.setValue('email', 'test@example.com')
      result.current.setValue('password', 'password123')
      result.current.setValue('username', 'jane')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.touched.email).toBe(true)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('supports custom validator function', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Test custom validator - username with space
    act(() => {
      result.current.setValue('username', 'john doe')
    })

    expect(result.current.errors.username).toBe('Username cannot contain spaces')

    // Valid username without space
    act(() => {
      result.current.setValue('username', 'johndoe')
    })

    expect(result.current.errors.username).toBeUndefined()
  })

  it('touched tracks which fields were edited', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Initially no fields are touched
    expect(result.current.touched).toEqual({})

    // Touch email field
    act(() => {
      result.current.setValue('email', 'test@example.com')
    })

    expect(result.current.touched.email).toBe(true)
    expect(result.current.touched.password).toBeUndefined()

    // Touch password field
    act(() => {
      result.current.setValue('password', 'password123')
    })

    expect(result.current.touched.email).toBe(true)
    expect(result.current.touched.password).toBe(true)
    expect(result.current.touched.username).toBeUndefined()
  })

  it('validates minLength and maxLength', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Test minLength
    act(() => {
      result.current.setValue('password', 'short')
    })

    expect(result.current.errors.password).toBe('Minimum length is 8')

    // Test maxLength
    act(() => {
      result.current.setValue('password', 'thisisaverylongpasswordthatexceedsmax')
    })

    expect(result.current.errors.password).toBe('Maximum length is 20')

    // Valid length
    act(() => {
      result.current.setValue('password', 'validpassword')
    })

    expect(result.current.errors.password).toBeUndefined()
  })

  it('validates all fields on validate call', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, rules)
    )

    // Call validate without setting values
    act(() => {
      const isValid = result.current.validate()
      expect(isValid).toBe(false)
    })

    // Should have errors for required fields
    expect(result.current.errors.email).toBe('This field is required')
    expect(result.current.errors.password).toBe('This field is required')
    expect(result.current.errors.username).toBeUndefined() // Not required, has initial value
  })

  it('handles empty rules gracefully', () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: 'test' }, {})
    )

    act(() => {
      result.current.setValue('name', 'new value')
    })

    expect(result.current.values.name).toBe('new value')
    expect(result.current.errors).toEqual({})
    expect(result.current.isValid).toBe(true)
  })
})