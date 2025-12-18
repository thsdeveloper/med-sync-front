/**
 * Unit tests for SMTP settings Zod validation schema
 *
 * Tests all validation rules to ensure proper SMTP configuration validation.
 */

import { describe, it, expect } from 'vitest';
import {
  smtpSettingsSchema,
  smtpSettingsUpdateSchema,
  type SmtpSettingsFormData,
} from '../smtp-settings.schema';

describe('smtpSettingsSchema', () => {
  describe('Valid SMTP configurations', () => {
    it('should accept valid SMTP configuration with all fields', () => {
      const validData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'securePassword123',
        smtp_from_email: 'noreply@medsync.com',
        smtp_from_name: 'MedSync Notificações',
        use_tls: true,
        is_enabled: true,
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept valid SMTP configuration with minimal fields', () => {
      const validData = {
        smtp_host: 'mail.example.com',
        smtp_port: 25,
        smtp_user: 'test@example.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.smtp_from_name).toBe(''); // Default value
        expect(result.data.use_tls).toBe(true); // Default value
        expect(result.data.is_enabled).toBe(false); // Default value
      }
    });

    it('should accept IPv4 address as smtp_host', () => {
      const validData = {
        smtp_host: '192.168.1.100',
        smtp_port: 587,
        smtp_user: 'user@example.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept localhost as smtp_host', () => {
      const validData = {
        smtp_host: 'localhost',
        smtp_port: 1025,
        smtp_user: 'test@localhost.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@localhost.com',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept subdomain in smtp_host', () => {
      const validData = {
        smtp_host: 'mail.smtp.example.com',
        smtp_port: 465,
        smtp_user: 'user@example.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept email with plus addressing in smtp_user', () => {
      const validData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user+tag@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should convert smtp_user and smtp_from_email to lowercase', () => {
      const validData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'USER@GMAIL.COM',
        smtp_password: 'password123',
        smtp_from_email: 'NOREPLY@EXAMPLE.COM',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.smtp_user).toBe('user@gmail.com');
        expect(result.data.smtp_from_email).toBe('noreply@example.com');
      }
    });

    it('should trim whitespace from string fields', () => {
      const validData = {
        smtp_host: '  smtp.gmail.com  ',
        smtp_port: 587,
        smtp_user: '  user@gmail.com  ',
        smtp_password: 'password123',
        smtp_from_email: '  noreply@example.com  ',
      };

      const result = smtpSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.smtp_host).toBe('smtp.gmail.com');
        expect(result.data.smtp_user).toBe('user@gmail.com');
        expect(result.data.smtp_from_email).toBe('noreply@example.com');
      }
    });
  });

  describe('Invalid email format', () => {
    it('should reject invalid smtp_user email', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'invalid-email',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        const userError = issues.find((e) => e.path.includes('smtp_user'));
        expect(userError).toBeDefined();
        expect(userError?.message.toLowerCase()).toContain('email');
      }
    });

    it('should reject invalid smtp_from_email format', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'not-an-email',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        const emailError = issues.find((e) => e.path.includes('smtp_from_email'));
        expect(emailError).toBeDefined();
        expect(emailError?.message.toLowerCase()).toContain('email');
      }
    });

    it('should reject email without domain', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'usergmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid port number', () => {
    it('should reject port number below 1', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 0,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const portError = result.error.issues.find((e) => e.path.includes('smtp_port'));
        expect(portError).toBeDefined();
      }
    });

    it('should reject port number above 65535', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 65536,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const portError = result.error.issues.find((e) => e.path.includes('smtp_port'));
        expect(portError).toBeDefined();
      }
    });

    it('should reject negative port number', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: -587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject decimal port number', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587.5,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject string port number', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587' as any,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid smtp_host', () => {
    it('should reject empty smtp_host', () => {
      const invalidData = {
        smtp_host: '',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid domain format', () => {
      const invalidData = {
        smtp_host: 'invalid..domain',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid smtp_password', () => {
    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'pass123',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const passError = result.error.issues.find((e) => e.path.includes('smtp_password'));
        expect(passError).toBeDefined();
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: '',
        smtp_from_email: 'noreply@example.com',
      };

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('Required fields', () => {
    it('should reject missing smtp_host', () => {
      const invalidData = {
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      } as any;

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing smtp_port', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      } as any;

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing smtp_user', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
      } as any;

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing smtp_password', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_from_email: 'noreply@example.com',
      } as any;

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing smtp_from_email', () => {
      const invalidData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
      } as any;

      const result = smtpSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('TypeScript type export', () => {
    it('should export SmtpSettingsFormData type', () => {
      const typedData: SmtpSettingsFormData = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'user@gmail.com',
        smtp_password: 'password123',
        smtp_from_email: 'noreply@example.com',
        smtp_from_name: 'MedSync',
        use_tls: true,
        is_enabled: true,
      };

      // Type check - this will fail compilation if type is incorrect
      expect(typedData.smtp_host).toBe('smtp.gmail.com');
      expect(typedData.smtp_port).toBe(587);
    });
  });

  describe('smtpSettingsUpdateSchema (partial)', () => {
    it('should accept partial updates', () => {
      const partialData = {
        is_enabled: false,
        use_tls: true,
      };

      const result = smtpSettingsUpdateSchema.safeParse(partialData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_enabled).toBe(false);
        expect(result.data.use_tls).toBe(true);
      }
    });

    it('should accept single field update', () => {
      const partialData = {
        smtp_port: 465,
      };

      const result = smtpSettingsUpdateSchema.safeParse(partialData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.smtp_port).toBe(465);
      }
    });

    it('should validate partial data against same rules', () => {
      const invalidPartialData = {
        smtp_port: 99999, // Invalid port
      };

      const result = smtpSettingsUpdateSchema.safeParse(invalidPartialData);

      expect(result.success).toBe(false);
    });
  });
});
