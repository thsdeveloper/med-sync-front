/**
 * Vitest Test Setup File
 *
 * This file runs before each test file and configures the testing environment.
 * It imports jest-dom matchers to extend Vitest's expect API with DOM-specific assertions.
 *
 * Available matchers from jest-dom:
 * - toBeDisabled()
 * - toBeEnabled()
 * - toBeEmptyDOMElement()
 * - toBeInTheDocument()
 * - toBeInvalid()
 * - toBeRequired()
 * - toBeValid()
 * - toBeVisible()
 * - toContainElement()
 * - toContainHTML()
 * - toHaveAccessibleDescription()
 * - toHaveAccessibleName()
 * - toHaveAttribute()
 * - toHaveClass()
 * - toHaveFocus()
 * - toHaveFormValues()
 * - toHaveStyle()
 * - toHaveTextContent()
 * - toHaveValue()
 * - toHaveDisplayValue()
 * - toBeChecked()
 * - toBePartiallyChecked()
 * - toHaveErrorMessage()
 *
 * @see https://github.com/testing-library/jest-dom
 */

import '@testing-library/jest-dom/vitest'

// Global test setup can be added here
// For example: mocking environment variables, global mocks, etc.

// Mock Next.js router if needed globally
// This can be overridden in individual test files
if (typeof window !== 'undefined') {
  // Setup any browser-specific globals
}
