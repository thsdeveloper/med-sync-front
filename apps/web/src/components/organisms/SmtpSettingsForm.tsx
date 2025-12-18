'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { smtpSettingsSchema } from '@/schemas/smtp-settings.schema'
import type { z } from 'zod'

// Use input type to handle optional fields with defaults
type SmtpSettingsInput = z.input<typeof smtpSettingsSchema>
type SmtpSettingsOutput = z.output<typeof smtpSettingsSchema>

/**
 * Props for the SmtpSettingsForm component
 */
export interface SmtpSettingsFormProps {
  /**
   * Initial form values (for editing existing configuration)
   */
  defaultValues?: Partial<SmtpSettingsOutput>

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: SmtpSettingsOutput) => Promise<void>

  /**
   * Callback when test connection is triggered
   */
  onTestConnection?: (data: SmtpSettingsOutput) => Promise<void>

  /**
   * Whether the form is in a loading state
   */
  isLoading?: boolean

  /**
   * Whether the form is disabled
   */
  disabled?: boolean

  /**
   * Custom submit button text
   */
  submitButtonText?: string

  /**
   * Custom test connection button text
   */
  testButtonText?: string

  /**
   * Show card wrapper around form
   */
  showCard?: boolean
}

/**
 * SmtpSettingsForm Component
 *
 * A comprehensive form for configuring SMTP email settings.
 * Includes validation, password visibility toggle, and test connection functionality.
 *
 * @example
 * ```tsx
 * <SmtpSettingsForm
 *   defaultValues={existingSettings}
 *   onSubmit={handleSave}
 *   onTestConnection={handleTest}
 *   submitButtonText="Salvar Configurações"
 * />
 * ```
 */
export function SmtpSettingsForm({
  defaultValues,
  onSubmit,
  onTestConnection,
  isLoading = false,
  disabled = false,
  submitButtonText = 'Salvar Configurações',
  testButtonText = 'Testar Conexão',
  showCard = true,
}: SmtpSettingsFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const form = useForm<SmtpSettingsInput>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtp_host: defaultValues?.smtp_host || '',
      smtp_port: defaultValues?.smtp_port || 587,
      smtp_user: defaultValues?.smtp_user || '',
      smtp_password: defaultValues?.smtp_password || '',
      smtp_from_email: defaultValues?.smtp_from_email || '',
      smtp_from_name: defaultValues?.smtp_from_name || '',
      use_tls: defaultValues?.use_tls ?? true,
      is_enabled: defaultValues?.is_enabled ?? false,
    },
  })

  const handleSubmit = async (data: SmtpSettingsInput) => {
    try {
      // Validate and transform to output type
      const validation = smtpSettingsSchema.safeParse(data)
      if (!validation.success) {
        toast.error('Erro de validação nos dados do formulário')
        return
      }

      await onSubmit(validation.data)
      toast.success('Configurações SMTP salvas com sucesso')
    } catch (error) {
      console.error('Error submitting SMTP settings:', error)
      toast.error('Erro ao salvar configurações SMTP')
    }
  }

  const handleTestConnection = async () => {
    try {
      setIsTesting(true)
      const currentValues = form.getValues()

      // Validate form before testing
      const validation = smtpSettingsSchema.safeParse(currentValues)
      if (!validation.success) {
        toast.error('Preencha todos os campos obrigatórios antes de testar a conexão')
        return
      }

      // Use validated data with defaults applied
      const validatedData = validation.data

      if (onTestConnection) {
        await onTestConnection(validatedData)
        toast.success('Conexão SMTP testada com sucesso! Email de teste enviado.')
      } else {
        // Default test connection implementation
        const response = await fetch('/api/smtp-settings/test-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao testar conexão SMTP')
        }

        toast.success('Conexão SMTP testada com sucesso! Email de teste enviado.')
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão SMTP'
      toast.error(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Server Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Configurações do Servidor</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* SMTP Host */}
            <FormField
              control={form.control}
              name="smtp_host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor SMTP *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="smtp.exemplo.com"
                      {...field}
                      disabled={disabled || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Endereço do servidor SMTP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SMTP Port */}
            <FormField
              control={form.control}
              name="smtp_port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porta *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="587"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      disabled={disabled || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Porta do servidor SMTP (587 ou 465)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* SMTP User */}
          <FormField
            control={form.control}
            name="smtp_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário SMTP *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="usuario@exemplo.com"
                    {...field}
                    disabled={disabled || isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Email de autenticação no servidor SMTP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SMTP Password */}
          <FormField
            control={form.control}
            name="smtp_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                      disabled={disabled || isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      disabled={disabled || isLoading}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Senha de autenticação no servidor SMTP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sender Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Configurações do Remetente</h3>
          </div>

          {/* From Email */}
          <FormField
            control={form.control}
            name="smtp_from_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Remetente *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="noreply@exemplo.com"
                    {...field}
                    disabled={disabled || isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Email que aparecerá como remetente das mensagens
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* From Name */}
          <FormField
            control={form.control}
            name="smtp_from_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Remetente</FormLabel>
                <FormControl>
                  <Input
                    placeholder="MedSync"
                    {...field}
                    disabled={disabled || isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Nome que aparecerá como remetente das mensagens
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Security and Status Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Segurança e Status</h3>
          </div>

          <div className="space-y-4">
            {/* Use TLS */}
            <FormField
              control={form.control}
              name="use_tls"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usar TLS/SSL</FormLabel>
                    <FormDescription>
                      Habilitar criptografia TLS/SSL para conexão segura
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled || isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Is Enabled */}
            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar Envio de Emails</FormLabel>
                    <FormDescription>
                      Habilitar o envio de emails através desta configuração
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled || isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={disabled || isLoading || isTesting}
            className="w-full sm:w-auto"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                {testButtonText}
              </>
            )}
          </Button>

          <Button
            type="submit"
            disabled={disabled || isLoading || isTesting}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  )

  if (!showCard) {
    return formContent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações SMTP</CardTitle>
        <CardDescription>
          Configure o servidor SMTP para envio de emails do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}
