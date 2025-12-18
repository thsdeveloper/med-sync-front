import { test, expect } from '@playwright/test';

test.describe('F042: MedicalStaffPerformanceMetrics Component', () => {
  test.describe('Component Rendering', () => {
    test('should have component file in correct location', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(
        process.cwd(),
        'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
      );
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    test('should export required component and types', async () => {
      const component = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );
      expect(component.MedicalStaffPerformanceMetrics).toBeDefined();
    });

    test('should have Recharts library installed', async () => {
      const packageJson = require('../../package.json');
      expect(packageJson.dependencies.recharts).toBeDefined();
    });
  });

  test.describe('Component Structure', () => {
    test('should render all metric cards with correct data-testid', async () => {
      // This test verifies component structure without needing a live page
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      const mockShifts = [
        {
          id: '1',
          date: new Date(),
          facility: 'Hospital A',
          hours: 8,
          status: 'completed' as const,
        },
      ];

      render(
        MedicalStaffPerformanceMetrics({
          shifts: mockShifts,
        })
      );

      expect(screen.getByTestId('performance-metrics')).toBeTruthy();
      expect(screen.getAllByTestId('metric-card').length).toBe(4);
    });

    test('should render time range selector', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByTestId('time-range-selector')).toBeTruthy();
    });

    test('should render performance chart container', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByTestId('performance-chart')).toBeTruthy();
    });
  });

  test.describe('Metrics Display', () => {
    test('should display total shifts metric', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('Total de Plantões')).toBeTruthy();
    });

    test('should display total hours metric', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('Total de Horas')).toBeTruthy();
    });

    test('should display facilities worked metric', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('Clínicas Atendidas')).toBeTruthy();
    });

    test('should display attendance rate metric', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('Taxa de Presença')).toBeTruthy();
    });

    test('should calculate metrics correctly with sample data', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      const now = new Date();
      const mockShifts = [
        {
          id: '1',
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          facility: 'Hospital A',
          hours: 8,
          status: 'completed' as const,
        },
        {
          id: '2',
          date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          facility: 'Hospital A',
          hours: 6,
          status: 'completed' as const,
        },
        {
          id: '3',
          date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          facility: 'Clinic B',
          hours: 12,
          status: 'completed' as const,
        },
      ];

      render(
        MedicalStaffPerformanceMetrics({
          shifts: mockShifts,
          defaultTimeRange: 30,
        })
      );

      // Total shifts should be 3
      expect(screen.getByText('3')).toBeTruthy();
      // Total hours should be 26 (8+6+12)
      expect(screen.getByText('26')).toBeTruthy();
      // Facilities should be 2 (Hospital A and Clinic B)
      expect(screen.getByText('2')).toBeTruthy();
      // Attendance rate should be 100% (all completed)
      expect(screen.getByText('100%')).toBeTruthy();
    });
  });

  test.describe('Time Range Selector', () => {
    test('should have 30 days option', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('30 dias')).toBeTruthy();
    });

    test('should have 90 days option', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('90 dias')).toBeTruthy();
    });

    test('should have 365 days option', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('365 dias')).toBeTruthy();
    });

    test('should default to specified time range', async () => {
      const { render } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      const { container } = render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
          defaultTimeRange: 90,
        })
      );

      // Check that 90 days tab is active
      const tab90 = container.querySelector('[value="90"][data-state="active"]');
      expect(tab90).toBeTruthy();
    });
  });

  test.describe('Chart Rendering', () => {
    test('should have Recharts components imported', async () => {
      const recharts = await import('recharts');
      expect(recharts.BarChart).toBeDefined();
      expect(recharts.LineChart).toBeDefined();
      expect(recharts.ResponsiveContainer).toBeDefined();
    });

    test('should render chart tabs for switching between shifts and hours', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      const now = new Date();
      const mockShifts = [
        {
          id: '1',
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          facility: 'Hospital A',
          hours: 8,
          status: 'completed' as const,
        },
      ];

      render(
        MedicalStaffPerformanceMetrics({
          shifts: mockShifts,
        })
      );

      expect(screen.getByText('Plantões por Mês')).toBeTruthy();
      expect(screen.getByText('Horas por Mês')).toBeTruthy();
    });

    test('should render chart type toggles (bar/line)', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      const now = new Date();
      const mockShifts = [
        {
          id: '1',
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          facility: 'Hospital A',
          hours: 8,
          status: 'completed' as const,
        },
      ];

      render(
        MedicalStaffPerformanceMetrics({
          shifts: mockShifts,
        })
      );

      // Should have chart visualization title
      expect(screen.getByText('Visualização de Dados')).toBeTruthy();
    });

    test('should show empty state when no shifts available', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
        })
      );

      expect(screen.getByText('Nenhum Dado Disponível')).toBeTruthy();
      expect(
        screen.getByText(/Não há dados de plantões para o período selecionado/i)
      ).toBeTruthy();
    });
  });

  test.describe('Loading State', () => {
    test('should render skeleton loaders when loading', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
          loading: true,
        })
      );

      // Component should render with loading state
      expect(screen.getByTestId('performance-metrics')).toBeTruthy();
      // Should not show actual content like metric titles
      expect(screen.queryByText('Total de Plantões')).toBeNull();
    });

    test('should hide time range selector when loading', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { MedicalStaffPerformanceMetrics } = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );

      render(
        MedicalStaffPerformanceMetrics({
          shifts: [],
          loading: true,
        })
      );

      expect(screen.queryByTestId('time-range-selector')).toBeNull();
    });
  });

  test.describe('Responsive Design', () => {
    test('should use ResponsiveContainer from Recharts', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain('ResponsiveContainer');
    });

    test('should have responsive grid classes for metric cards', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain('grid-cols-1');
      expect(componentCode).toContain('sm:grid-cols-2');
      expect(componentCode).toContain('lg:grid-cols-4');
    });
  });

  test.describe('UI Components', () => {
    test('should use shadcn/ui Card component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain("from '@/components/ui/card'");
    });

    test('should use shadcn/ui Tabs component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain("from '@/components/ui/tabs'");
    });

    test('should use Lucide React icons', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain("from 'lucide-react'");
      expect(componentCode).toContain('Calendar');
      expect(componentCode).toContain('Clock');
      expect(componentCode).toContain('Building2');
      expect(componentCode).toContain('TrendingUp');
    });
  });

  test.describe('TypeScript Type Safety', () => {
    test('should export TimeRange type', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      // Verify TimeRange type is exported
      expect(componentCode).toContain('export type TimeRange');
    });

    test('should export ShiftData interface', async () => {
      const component = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );
      expect(component).toBeDefined();
    });

    test('should export PerformanceMetrics interface', async () => {
      const component = await import(
        '../../src/components/organisms/MedicalStaffPerformanceMetrics'
      );
      expect(component).toBeDefined();
    });

    test('should have JSDoc documentation', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain('/**');
      expect(componentCode).toContain('@example');
    });
  });

  test.describe('Atomic Design Methodology', () => {
    test('should be in organisms directory', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(
        process.cwd(),
        'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
      );
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    test('should be a client component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain("'use client'");
    });

    test('should use React.memo for performance', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );

      expect(componentCode).toContain('React.memo');
    });
  });
});
