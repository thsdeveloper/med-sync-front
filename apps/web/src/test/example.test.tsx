/**
 * Example Test File
 *
 * This file demonstrates the basic testing setup and verifies that
 * Vitest and React Testing Library are configured correctly.
 *
 * This test can be removed once real tests are added to the project.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'

// Simple test component
function HelloWorld({ name = 'World' }: { name?: string }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>This is a test component.</p>
    </div>
  )
}

describe('Example Test Suite', () => {
  it('should render hello world message', () => {
    render(<HelloWorld />)
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })

  it('should render custom name', () => {
    render(<HelloWorld name="Vitest" />)
    expect(screen.getByText('Hello, Vitest!')).toBeInTheDocument()
  })

  it('should render paragraph text', () => {
    render(<HelloWorld />)
    expect(screen.getByText('This is a test component.')).toBeInTheDocument()
  })

  it('should have heading element', () => {
    render(<HelloWorld />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Hello, World!')
  })
})

describe('Test Utilities', () => {
  it('should have access to jest-dom matchers', () => {
    render(<button disabled>Click me</button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toBeInTheDocument()
  })

  it('should support custom render with theme', () => {
    render(<HelloWorld />, { theme: 'dark' })
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })
})

describe('Basic Assertions', () => {
  it('should perform basic equality checks', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBeTruthy()
  })

  it('should handle arrays and objects', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)

    const obj = { name: 'test', value: 42 }
    expect(obj).toHaveProperty('name')
    expect(obj.value).toBe(42)
  })
})
