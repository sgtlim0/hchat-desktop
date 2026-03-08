type Validator = (value: unknown) => { valid: boolean; error?: string }

export const s = {
  string(): Validator {
    return (v) => typeof v === 'string' ? { valid: true } : { valid: false, error: 'Expected string' }
  },
  number(): Validator {
    return (v) => typeof v === 'number' && !isNaN(v) ? { valid: true } : { valid: false, error: 'Expected number' }
  },
  boolean(): Validator {
    return (v) => typeof v === 'boolean' ? { valid: true } : { valid: false, error: 'Expected boolean' }
  },
  array(itemValidator?: Validator): Validator {
    return (v) => {
      if (!Array.isArray(v)) return { valid: false, error: 'Expected array' }
      if (itemValidator) {
        for (let i = 0; i < v.length; i++) {
          const r = itemValidator(v[i])
          if (!r.valid) return { valid: false, error: `[${i}]: ${r.error}` }
        }
      }
      return { valid: true }
    }
  },
  object(shape: Record<string, Validator>): Validator {
    return (v) => {
      if (v === null || typeof v !== 'object' || Array.isArray(v))
        return { valid: false, error: 'Expected object' }
      for (const [key, validator] of Object.entries(shape)) {
        const r = validator((v as Record<string, unknown>)[key])
        if (!r.valid) return { valid: false, error: `${key}: ${r.error}` }
      }
      return { valid: true }
    }
  },
  optional(validator: Validator): Validator {
    return (v) => (v === undefined || v === null) ? { valid: true } : validator(v)
  },
  oneOf<T>(values: T[]): Validator {
    return (v) => values.includes(v as T) ? { valid: true } : { valid: false, error: `Expected one of: ${values.join(', ')}` }
  },
  min(n: number): Validator {
    return (v) => typeof v === 'number' && v >= n ? { valid: true } : { valid: false, error: `Expected >= ${n}` }
  },
  max(n: number): Validator {
    return (v) => typeof v === 'number' && v <= n ? { valid: true } : { valid: false, error: `Expected <= ${n}` }
  },
}

export function validate(value: unknown, validator: Validator): { valid: boolean; error?: string } {
  return validator(value)
}
