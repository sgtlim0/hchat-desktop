import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useFormValidation } from '../useFormValidation'

// Test component that uses the hook
function TestForm() {
  const { values, errors, touched, setValue, validate, isValid, reset } = useFormValidation(
    {
      name: '',
      email: '',
      age: ''
    },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      age: {
        custom: (value) => {
          const age = parseInt(value)
          if (isNaN(age) || age < 18 || age > 120) {
            return 'Age must be between 18 and 120'
          }
          return null
        }
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      console.log('Form submitted:', values)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          data-testid="name-input"
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
          placeholder="Name"
        />
        {touched.name && errors.name && (
          <span data-testid="name-error">{errors.name}</span>
        )}
      </div>

      <div>
        <input
          data-testid="email-input"
          value={values.email}
          onChange={(e) => setValue('email', e.target.value)}
          placeholder="Email"
        />
        {touched.email && errors.email && (
          <span data-testid="email-error">{errors.email}</span>
        )}
      </div>

      <div>
        <input
          data-testid="age-input"
          value={values.age}
          onChange={(e) => setValue('age', e.target.value)}
          placeholder="Age"
        />
        {touched.age && errors.age && (
          <span data-testid="age-error">{errors.age}</span>
        )}
      </div>

      <button type="submit" disabled={!isValid} data-testid="submit-btn">
        Submit
      </button>
      <button type="button" onClick={reset} data-testid="reset-btn">
        Reset
      </button>
    </form>
  )
}

describe('useFormValidation integration', () => {
  it('works in a real form component', () => {
    render(<TestForm />)

    const nameInput = screen.getByTestId('name-input')
    const emailInput = screen.getByTestId('email-input')
    const ageInput = screen.getByTestId('age-input')
    const submitBtn = screen.getByTestId('submit-btn')

    // Initially submit is disabled
    expect(submitBtn).toBeDisabled()

    // Fill in invalid values
    fireEvent.change(nameInput, { target: { value: 'J' } })
    expect(screen.getByTestId('name-error')).toHaveTextContent('Minimum length is 2')

    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email')

    fireEvent.change(ageInput, { target: { value: '15' } })
    expect(screen.getByTestId('age-error')).toHaveTextContent('Age must be between 18 and 120')

    // Still disabled
    expect(submitBtn).toBeDisabled()

    // Fill in valid values
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    expect(screen.queryByTestId('name-error')).not.toBeInTheDocument()

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()

    fireEvent.change(ageInput, { target: { value: '25' } })
    expect(screen.queryByTestId('age-error')).not.toBeInTheDocument()

    // Now submit should be enabled
    expect(submitBtn).not.toBeDisabled()

    // Test reset
    fireEvent.click(screen.getByTestId('reset-btn'))
    expect(nameInput).toHaveValue('')
    expect(emailInput).toHaveValue('')
    expect(ageInput).toHaveValue('')
    expect(submitBtn).toBeDisabled()
  })
})