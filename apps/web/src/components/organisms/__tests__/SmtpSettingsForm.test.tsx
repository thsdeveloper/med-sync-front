import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { SmtpSettingsForm } from '../SmtpSettingsForm'
import { smtpSettingsSchema } from '@/schemas/smtp-settings.schema'
import type { z } from 'zod'

type SmtpSettingsFormData = z.output<typeof smtpSettingsSchema>

describe('SmtpSettingsForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnTestConnection = vi.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onTestConnection: mockOnTestConnection,
  }

  const validSmtpData: SmtpSettingsFormData = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'user@example.com',
    smtp_password: 'securePassword123',
    smtp_from_email: 'noreply@example.com',
    smtp_from_name: 'MedSync',
    use_tls: true,
    is_enabled: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SmtpSettingsForm {...defaultProps} />)

      // Server configuration fields
      expect(screen.getByLabelText(/servidor smtp/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/porta/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/usuário smtp/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()

      // Sender configuration fields
      expect(screen.getByLabelText(/email remetente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nome remetente/i)).toBeInTheDocument()

      // Security and status fields
      expect(screen.getByText(/usar tls\/ssl/i)).toBeInTheDocument()
      expect(screen.getByText(/ativar envio de emails/i)).toBeInTheDocument()
    })

    it('should render card wrapper by default', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      expect(screen.getByText('Configurações SMTP')).toBeInTheDocument()
      expect(screen.getByText(/configure o servidor smtp/i)).toBeInTheDocument()
    })

    it('should not render card wrapper when showCard is false', () => {
      render(<SmtpSettingsForm {...defaultProps} showCard={false} />)
      expect(screen.queryByText('Configurações SMTP')).not.toBeInTheDocument()
    })

    it('should render Test Connection button', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      expect(screen.getByRole('button', { name: /testar conexão/i })).toBeInTheDocument()
    })

    it('should render submit button with default text', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      expect(screen.getByRole('button', { name: /salvar configurações/i })).toBeInTheDocument()
    })

    it('should render custom submit button text', () => {
      render(<SmtpSettingsForm {...defaultProps} submitButtonText="Save Settings" />)
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
    })

    it('should render custom test button text', () => {
      render(<SmtpSettingsForm {...defaultProps} testButtonText="Test Now" />)
      expect(screen.getByRole('button', { name: /test now/i })).toBeInTheDocument()
    })

    it('should populate form with default values', () => {
      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('587')).toBeInTheDocument()
      expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('noreply@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('MedSync')).toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should render password field with type password by default', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      const passwordInput = screen.getByLabelText(/senha/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/senha/i)
      const toggleButton = screen.getByRole('button', { name: /mostrar senha/i })

      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument()

      await user.click(toggleButton)

      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should show Eye icon when password is hidden', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      expect(screen.getByRole('button', { name: /mostrar senha/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should display validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/o host smtp é obrigatório/i)).toBeInTheDocument()
      })
    })

    it('should display validation error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const userEmailInput = screen.getByLabelText(/usuário smtp/i)
      await user.type(userEmailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      })
    })

    it('should display validation error for invalid port number', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const portInput = screen.getByLabelText(/porta/i)
      await user.clear(portInput)
      await user.type(portInput, '70000')

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/a porta deve estar entre 1 e 65535/i)).toBeInTheDocument()
      })
    })

    it('should display validation error for short password', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/senha/i)
      await user.type(passwordInput, '123')

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/a senha deve ter no mínimo 8 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(validSmtpData)
      })
    })

    it('should display loading state during submission', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} isLoading={true} />)

      expect(screen.getByText(/salvando.../i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /salvando.../i })).toBeDisabled()
    })

    it('should disable all inputs during submission', async () => {
      render(<SmtpSettingsForm {...defaultProps} isLoading={true} />)

      const hostInput = screen.getByLabelText(/servidor smtp/i)
      const portInput = screen.getByLabelText(/porta/i)
      const userInput = screen.getByLabelText(/usuário smtp/i)

      expect(hostInput).toBeDisabled()
      expect(portInput).toBeDisabled()
      expect(userInput).toBeDisabled()
    })

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOnSubmit.mockRejectedValue(new Error('Network error'))

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })
  })

  describe('Test Connection', () => {
    it('should call onTestConnection when Test Connection button is clicked', async () => {
      const user = userEvent.setup()
      mockOnTestConnection.mockResolvedValue(undefined)

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(mockOnTestConnection).toHaveBeenCalledWith(validSmtpData)
      })
    })

    it('should display loading state during connection test', async () => {
      const user = userEvent.setup()
      mockOnTestConnection.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      expect(screen.getByText(/testando.../i)).toBeInTheDocument()
      expect(testButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByText(/testando.../i)).not.toBeInTheDocument()
      })
    })

    it('should validate form before testing connection', async () => {
      const user = userEvent.setup()
      render(<SmtpSettingsForm {...defaultProps} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(mockOnTestConnection).not.toHaveBeenCalled()
      })
    })

    it('should handle test connection errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOnTestConnection.mockRejectedValue(new Error('Connection failed'))

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    it('should use default API endpoint when onTestConnection is not provided', async () => {
      const user = userEvent.setup()
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<SmtpSettingsForm onSubmit={mockOnSubmit} defaultValues={validSmtpData} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/smtp-settings/test-connection',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validSmtpData),
          })
        )
      })
    })

    it('should handle API errors when using default endpoint', async () => {
      const user = userEvent.setup()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Connection timeout' }),
      })

      render(<SmtpSettingsForm onSubmit={mockOnSubmit} defaultValues={validSmtpData} />)

      const testButton = screen.getByRole('button', { name: /testar conexão/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })
  })

  describe('Switch Controls', () => {
    it('should toggle use_tls switch', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      // Find switch by its label text
      const tlsSwitch = screen.getByRole('switch', { name: /usar tls\/ssl/i })

      expect(tlsSwitch).toBeChecked()

      await user.click(tlsSwitch)

      expect(tlsSwitch).not.toBeChecked()
    })

    it('should toggle is_enabled switch', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<SmtpSettingsForm {...defaultProps} defaultValues={validSmtpData} />)

      const enabledSwitch = screen.getByRole('switch', { name: /ativar envio de emails/i })

      expect(enabledSwitch).toBeChecked()

      await user.click(enabledSwitch)

      expect(enabledSwitch).not.toBeChecked()
    })

    it('should disable switches when form is disabled', () => {
      render(<SmtpSettingsForm {...defaultProps} disabled={true} />)

      const tlsSwitch = screen.getByRole('switch', { name: /usar tls\/ssl/i })
      const enabledSwitch = screen.getByRole('switch', { name: /ativar envio de emails/i })

      expect(tlsSwitch).toBeDisabled()
      expect(enabledSwitch).toBeDisabled()
    })
  })

  describe('Disabled State', () => {
    it('should disable all form controls when disabled prop is true', () => {
      render(<SmtpSettingsForm {...defaultProps} disabled={true} />)

      const hostInput = screen.getByLabelText(/servidor smtp/i)
      const submitButton = screen.getByRole('button', { name: /salvar configurações/i })
      const testButton = screen.getByRole('button', { name: /testar conexão/i })

      expect(hostInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(testButton).toBeDisabled()
    })

    it('should disable password toggle when form is disabled', () => {
      render(<SmtpSettingsForm {...defaultProps} disabled={true} />)

      const toggleButton = screen.getByRole('button', { name: /mostrar senha/i })
      expect(toggleButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-labels for password toggle', () => {
      render(<SmtpSettingsForm {...defaultProps} />)
      expect(screen.getByLabelText(/mostrar senha/i)).toBeInTheDocument()
    })

    it('should have form labels associated with inputs', () => {
      render(<SmtpSettingsForm {...defaultProps} />)

      const hostInput = screen.getByLabelText(/servidor smtp/i)
      expect(hostInput).toHaveAttribute('name', 'smtp_host')
    })

    it('should have descriptive form field descriptions', () => {
      render(<SmtpSettingsForm {...defaultProps} />)

      expect(screen.getByText(/endereço do servidor smtp/i)).toBeInTheDocument()
      expect(screen.getByText(/porta do servidor smtp/i)).toBeInTheDocument()
    })
  })
})
