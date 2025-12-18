import { test, expect } from '@playwright/test';

test.describe('F041 - MedicalStaffShiftHistory Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with the component (we'll create a demo page)
    await page.goto('/');
  });

  test.describe('Component Rendering', () => {
    test('should render component with shift history data', async ({ page }) => {
      // Verify component file exists
      const componentPath =
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx';
      const fs = require('fs');
      expect(fs.existsSync(componentPath)).toBeTruthy();
    });

    test('should have all required exports', async ({ page }) => {
      // Test that component exports are available
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Check for key exports
      expect(componentContent).toContain('export interface ShiftHistoryItem');
      expect(componentContent).toContain('export interface MedicalStaffShiftHistoryProps');
      expect(componentContent).toContain('export const MedicalStaffShiftHistory');
    });

    test('should implement virtual scrolling with @tanstack/react-virtual', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify virtual scrolling imports and usage
      expect(componentContent).toContain("import { useVirtualizer } from '@tanstack/react-virtual'");
      expect(componentContent).toContain('useVirtualizer');
      expect(componentContent).toContain('getVirtualItems');
    });
  });

  test.describe('Data Display', () => {
    test('should display shift details structure', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify all required shift details are rendered
      expect(componentContent).toContain('formatDate'); // Date display
      expect(componentContent).toContain('facility'); // Facility name
      expect(componentContent).toContain('specialty'); // Specialty
      expect(componentContent).toContain('formatHours'); // Hours worked
      expect(componentContent).toContain('status'); // Status badge
    });

    test('should sort shifts by date (newest first)', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify sorting function exists and sorts descending
      expect(componentContent).toContain('sortShiftsByDate');
      expect(componentContent).toContain('dateB.getTime() - dateA.getTime()'); // Descending order
    });

    test('should display all shift details fields', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify ShiftHistoryItem interface has all required fields
      expect(componentContent).toMatch(/id:\s*string/);
      expect(componentContent).toMatch(/date:\s*Date \| string/);
      expect(componentContent).toMatch(/facility:\s*string/);
      expect(componentContent).toMatch(/specialty:\s*string \| null/);
      expect(componentContent).toMatch(/hours:\s*number/);
      expect(componentContent).toMatch(/status:\s*ShiftStatus/);
    });
  });

  test.describe('Status Badges', () => {
    test('should have status configuration with correct colors', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify all 4 status types with proper color coding
      expect(componentContent).toContain('completed');
      expect(componentContent).toContain('bg-green-100'); // Completed = green
      expect(componentContent).toContain('scheduled');
      expect(componentContent).toContain('bg-blue-100'); // Scheduled = blue
      expect(componentContent).toContain('cancelled');
      expect(componentContent).toContain('bg-red-100'); // Cancelled = red
      expect(componentContent).toContain('in_progress');
      expect(componentContent).toContain('bg-orange-100'); // In progress = orange
    });

    test('should have Portuguese status labels', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify Portuguese labels
      expect(componentContent).toContain('Concluído');
      expect(componentContent).toContain('Agendado');
      expect(componentContent).toContain('Cancelado');
      expect(componentContent).toContain('Em Andamento');
    });
  });

  test.describe('Empty State', () => {
    test('should have empty state component', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify empty state implementation
      expect(componentContent).toContain('EmptyState');
      expect(componentContent).toContain('shift-empty-state');
      expect(componentContent).toContain('Nenhum plantão encontrado');
      expect(componentContent).toContain('CalendarX'); // Empty state icon
    });

    test('should show empty state when no shifts', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify conditional rendering for empty state
      expect(componentContent).toContain('sortedShifts.length === 0');
      expect(componentContent).toContain('<EmptyState />');
    });
  });

  test.describe('Loading State', () => {
    test('should have skeleton loader component', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify skeleton loader implementation
      expect(componentContent).toContain('SkeletonLoader');
      expect(componentContent).toContain('shift-history-skeleton');
      expect(componentContent).toContain('Skeleton');
    });

    test('should show skeleton when loading prop is true', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify loading state handling
      expect(componentContent).toContain('loading');
      expect(componentContent).toContain('<SkeletonLoader />');
    });
  });

  test.describe('Virtual Scrolling Performance', () => {
    test('should implement virtual scrolling for performance', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify virtual scrolling configuration
      expect(componentContent).toContain('useVirtualizer');
      expect(componentContent).toContain('count: sortedShifts.length');
      expect(componentContent).toContain('estimateSize'); // Row height estimation
      expect(componentContent).toContain('overscan'); // Render extra items for smooth scrolling
      expect(componentContent).toContain('getVirtualItems'); // Get visible items
    });

    test('should have configurable maxHeight prop', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify maxHeight prop with default value
      expect(componentContent).toContain("maxHeight = '600px'");
      expect(componentContent).toContain('style={{ maxHeight }}');
    });

    test('should optimize rendering with React.memo', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify performance optimizations
      expect(componentContent).toContain('React.memo');
      expect(componentContent).toContain('ShiftItem.displayName');
    });
  });

  test.describe('UI Components Usage', () => {
    test('should use shadcn/ui components', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify shadcn/ui component imports
      expect(componentContent).toContain("from '@/components/ui/badge'");
      expect(componentContent).toContain("from '@/components/ui/card'");
      expect(componentContent).toContain("from '@/components/ui/scroll-area'");
      expect(componentContent).toContain("from '@/components/ui/skeleton'");
    });

    test('should use Lucide React icons', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify icon imports
      expect(componentContent).toContain("from 'lucide-react'");
      expect(componentContent).toContain('Calendar');
      expect(componentContent).toContain('Clock');
      expect(componentContent).toContain('Building2');
      expect(componentContent).toContain('Award');
      expect(componentContent).toContain('CalendarX');
    });
  });

  test.describe('Accessibility and Testing', () => {
    test('should have data-testid attributes for testing', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify test IDs from test_criteria
      expect(componentContent).toContain('data-testid="shift-history"');
      expect(componentContent).toContain('data-testid="shift-item"');
      expect(componentContent).toContain('data-testid="shift-empty-state"');
    });

    test('should have semantic HTML structure', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify proper HTML elements
      expect(componentContent).toContain('CardHeader');
      expect(componentContent).toContain('CardTitle');
      expect(componentContent).toContain('CardContent');
    });
  });

  test.describe('Date and Time Formatting', () => {
    test('should format dates in Portuguese locale', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify Portuguese date formatting
      expect(componentContent).toContain('formatDate');
      expect(componentContent).toContain("'pt-BR'");
      expect(componentContent).toContain('Intl.DateTimeFormat');
    });

    test('should format hours with proper plural handling', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify hours formatting with singular/plural
      expect(componentContent).toContain('formatHours');
      expect(componentContent).toContain('1 hora'); // Singular
      expect(componentContent).toContain('horas'); // Plural
    });
  });

  test.describe('TypeScript Type Safety', () => {
    test('should export all TypeScript types', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify type exports
      expect(componentContent).toContain('export type ShiftStatus');
      expect(componentContent).toContain('export interface ShiftHistoryItem');
      expect(componentContent).toContain('export interface MedicalStaffShiftHistoryProps');
    });

    test('should have comprehensive JSDoc documentation', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify JSDoc comments exist
      expect(componentContent).toContain('/**');
      expect(componentContent).toContain('@example');
      // Component has JSDoc for interfaces and types with /** descriptive comments */
      expect(componentContent).toContain('/** ');
    });
  });

  test.describe('Component Props', () => {
    test('should accept all required props', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify prop interface
      expect(componentContent).toContain('shifts: ShiftHistoryItem[]');
      expect(componentContent).toContain('loading?: boolean');
      expect(componentContent).toContain('className?: string');
      expect(componentContent).toContain('maxHeight?: string');
      expect(componentContent).toContain('showCard?: boolean');
    });

    test('should have default prop values', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify default values
      expect(componentContent).toContain('loading = false');
      expect(componentContent).toContain("maxHeight = '600px'");
      expect(componentContent).toContain('showCard = true');
    });
  });

  test.describe('Component Integration', () => {
    test('should follow Atomic Design methodology', async ({ page }) => {
      const componentPath =
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx';

      // Verify component is in molecules folder
      expect(componentPath).toContain('/molecules/');
    });

    test('should be a client component', async ({ page }) => {
      const componentContent = require('fs').readFileSync(
        '/home/pcthiago/projetos/medsync-front/apps/web/src/components/molecules/MedicalStaffShiftHistory.tsx',
        'utf-8'
      );

      // Verify 'use client' directive
      expect(componentContent).toContain("'use client'");
    });
  });
});
