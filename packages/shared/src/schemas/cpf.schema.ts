import { z } from 'zod';

/**
 * Normalizes CPF to 11 digits only (removes formatting characters)
 */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formats CPF as XXX.XXX.XXX-XX
 */
export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Validates CPF checksum using the official Brazilian algorithm (modulo 11)
 * @param cpf - CPF string (can be formatted or just digits)
 * @returns true if checksum is valid
 */
export function isValidCpfChecksum(cpf: string): boolean {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) return false;

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Validate first check digit (10th position)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  // Validate second check digit (11th position)
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Validates CPF format and checksum
 * @param cpf - CPF string to validate
 * @returns validation result with error message if invalid
 */
export function validateCpf(cpf: string): {
  isValid: boolean;
  error?: string;
  normalized: string;
} {
  const normalized = normalizeCpf(cpf);

  if (normalized.length === 0) {
    return { isValid: false, error: 'CPF é obrigatório', normalized };
  }

  if (normalized.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos', normalized };
  }

  if (!isValidCpfChecksum(normalized)) {
    return { isValid: false, error: 'CPF inválido', normalized };
  }

  return { isValid: true, normalized };
}

/**
 * Zod schema for CPF validation
 * Accepts formatted (XXX.XXX.XXX-XX) or unformatted (XXXXXXXXXXX) CPF
 * Normalizes to 11 digits and validates checksum
 */
export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .transform(normalizeCpf)
  .refine((val) => val.length === 11, {
    message: 'CPF deve ter 11 dígitos',
  })
  .refine(isValidCpfChecksum, {
    message: 'CPF inválido',
  });

export type Cpf = z.infer<typeof cpfSchema>;
