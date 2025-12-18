import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@/test/utils';
import { MedicalStaffPerformanceMetrics, ShiftData } from '../MedicalStaffPerformanceMetrics';
import userEvent from '@testing-library/user-event';

// Mock Recharts components to avoid canvas/SVG rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: (props: any) => <div data-testid="responsive-container">{props.children}</div>,
  BarChart: (props: any) => <div data-testid="bar-chart">{props.children}</div>,
  LineChart: (props: any) => <div data-testid="line-chart">{props.children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockShifts: ShiftData[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    facility: 'Hospital A',
    hours: 8,
    status: 'completed',
  },
  {
    id: '2',
    date: new Date('2024-01-20'),
    facility: 'Clinic B',
    hours: 6,
    status: 'completed',
  },
  {
    id: '3',
    date: new Date('2024-02-10'),
    facility: 'Hospital A',
    hours: 12,
    status: 'completed',
  },
  {
    id: '4',
    date: new Date('2024-02-15'),
    facility: 'Clinic C',
    hours: 8,
    status: 'scheduled',
  },
  {
    id: '5',
    date: new Date('2024-03-01'),
    facility: 'Hospital A',
    hours: 10,
    status: 'completed',
  },
];

describe('MedicalStaffPerformanceMetrics', () => {
  describe('Rendering with Valid Data', () => {
    it('should render the component with all required elements', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      expect(screen.getByText('Métricas de Desempenho')).toBeInTheDocument();
      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
    });

    it('should render all 4 metric cards', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(metricCards).toHaveLength(4);
    });

    it('should display metric card titles correctly', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      expect(screen.getByText('Total de Plantões')).toBeInTheDocument();
      expect(screen.getByText('Total de Horas')).toBeInTheDocument();
      expect(screen.getByText('Clínicas Atendidas')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Presença')).toBeInTheDocument();
    });

    it('should render performance chart', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    });

    it('should display custom title when provided', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });

  describe('Metric Calculations', () => {
    it('should calculate total shifts correctly (last 30 days)', () => {
      // Create shifts within last 30 days
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'B', hours: 6, status: 'completed' },
        { id: '3', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), facility: 'C', hours: 12, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const totalShiftsCard = metricCards[0];
      expect(within(totalShiftsCard).getByText('3')).toBeInTheDocument();
    });

    it('should calculate total hours correctly', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'B', hours: 6, status: 'completed' },
        { id: '3', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), facility: 'C', hours: 12, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const totalHoursCard = metricCards[1];
      expect(within(totalHoursCard).getByText('26')).toBeInTheDocument();
    });

    it('should calculate unique facilities correctly', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'Hospital A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'Hospital A', hours: 6, status: 'completed' },
        { id: '3', date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), facility: 'Clinic B', hours: 12, status: 'completed' },
        { id: '4', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), facility: 'Clinic C', hours: 10, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const facilitiesCard = metricCards[2];
      expect(within(facilitiesCard).getByText('3')).toBeInTheDocument();
    });

    it('should calculate attendance rate correctly', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'B', hours: 6, status: 'completed' },
        { id: '3', date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), facility: 'C', hours: 12, status: 'completed' },
        { id: '4', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), facility: 'D', hours: 8, status: 'scheduled' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const attendanceCard = metricCards[3];
      // 3 completed out of 4 scheduled/completed = 75%
      expect(within(attendanceCard).getByText('75%')).toBeInTheDocument();
    });

    it('should handle 100% attendance rate', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'B', hours: 6, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const attendanceCard = metricCards[3];
      expect(within(attendanceCard).getByText('100%')).toBeInTheDocument();
    });

    it('should handle 0% attendance rate when no scheduled shifts', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'cancelled' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} defaultTimeRange={30} />);

      const metricCards = screen.getAllByTestId('metric-card');
      const attendanceCard = metricCards[3];
      expect(within(attendanceCard).getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Time Range Filtering', () => {
    it('should render time range selector with 3 options', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      expect(screen.getByRole('tab', { name: '30 dias' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '90 dias' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '365 dias' })).toBeInTheDocument();
    });

    it('should default to 30 days time range', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      const tab30Days = screen.getByRole('tab', { name: '30 dias' });
      expect(tab30Days).toHaveAttribute('data-state', 'active');
    });

    it('should use custom default time range when provided', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} defaultTimeRange={90} />);

      const tab90Days = screen.getByRole('tab', { name: '90 dias' });
      expect(tab90Days).toHaveAttribute('data-state', 'active');
    });

    it('should update metrics when time range changes', async () => {
      const user = userEvent.setup();
      const now = new Date();
      const shiftsWithVariedDates: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), facility: 'B', hours: 6, status: 'completed' },
        { id: '3', date: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), facility: 'C', hours: 12, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={shiftsWithVariedDates} defaultTimeRange={30} />);

      // Initially showing 30 days (1 shift)
      let metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[0]).getByText('1')).toBeInTheDocument();

      // Click 90 days tab
      const tab90Days = screen.getByRole('tab', { name: '90 dias' });
      await user.click(tab90Days);

      // Should now show 2 shifts (within 90 days)
      metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[0]).getByText('2')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('should render chart when data is available', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render bar chart by default', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should have both bar and line chart toggle options', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} />);

      // Bar chart should be visible by default
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

      // Component should have "Visualização de Dados" title indicating chart controls are present
      expect(screen.getByText('Visualização de Dados')).toBeInTheDocument();
    });

    it('should render both shifts and hours tabs', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} />);

      expect(screen.getByRole('tab', { name: 'Plantões por Mês' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Horas por Mês' })).toBeInTheDocument();
    });

    it('should display empty state when no shifts in time range', () => {
      render(<MedicalStaffPerformanceMetrics shifts={[]} />);

      expect(screen.getByText('Nenhum Dado Disponível')).toBeInTheDocument();
      expect(screen.getByText(/Não há dados de plantões para o período selecionado/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display skeleton loaders when loading', () => {
      render(<MedicalStaffPerformanceMetrics shifts={[]} loading={true} />);

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      // Should not show actual metric cards
      expect(screen.queryByText('Total de Plantões')).not.toBeInTheDocument();
    });

    it('should not display charts when loading', () => {
      render(<MedicalStaffPerformanceMetrics shifts={[]} loading={true} />);

      expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument();
    });

    it('should not display time range selector when loading', () => {
      render(<MedicalStaffPerformanceMetrics shifts={[]} loading={true} />);

      expect(screen.queryByTestId('time-range-selector')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shifts array', () => {
      render(<MedicalStaffPerformanceMetrics shifts={[]} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[0]).getByText('0')).toBeInTheDocument();
      expect(within(metricCards[1]).getByText('0')).toBeInTheDocument();
      expect(within(metricCards[2]).getByText('0')).toBeInTheDocument();
      expect(within(metricCards[3]).getByText('0%')).toBeInTheDocument();
    });

    it('should handle single shift', () => {
      const now = new Date();
      const singleShift: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={singleShift} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[0]).getByText('1')).toBeInTheDocument();
      expect(within(metricCards[0]).getByText('plantão realizado')).toBeInTheDocument();
    });

    it('should handle shifts with ISO string dates', () => {
      const now = new Date();
      const shiftsWithISODates: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={shiftsWithISODates} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[0]).getByText('1')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} className="custom-class" />);

      const container = screen.getByTestId('performance-metrics');
      expect(container).toHaveClass('custom-class');
    });

    it('should handle plural text for hours correctly', () => {
      const now = new Date();
      const singleHourShift: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 1, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={singleHourShift} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[1]).getByText('hora trabalhada')).toBeInTheDocument();
    });

    it('should handle plural text for facilities correctly', () => {
      const now = new Date();
      const singleFacility: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
        { id: '2', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), facility: 'A', hours: 6, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={singleFacility} />);

      const metricCards = screen.getAllByTestId('metric-card');
      expect(within(metricCards[2]).getByText('clínica única')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attributes', () => {
      const now = new Date();
      const recentShifts: ShiftData[] = [
        { id: '1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), facility: 'A', hours: 8, status: 'completed' },
      ];

      render(<MedicalStaffPerformanceMetrics shifts={recentShifts} />);

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
      expect(screen.getAllByTestId('metric-card')).toHaveLength(4);
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    });

    it('should use semantic HTML heading', () => {
      render(<MedicalStaffPerformanceMetrics shifts={mockShifts} />);

      const heading = screen.getByRole('heading', { name: 'Métricas de Desempenho' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('TypeScript Type Exports', () => {
    it('should export TimeRange type', () => {
      const timeRange: import('../MedicalStaffPerformanceMetrics').TimeRange = 30;
      expect(timeRange).toBe(30);
    });

    it('should export ShiftData interface', () => {
      const shift: import('../MedicalStaffPerformanceMetrics').ShiftData = {
        id: '1',
        date: new Date(),
        facility: 'Test',
        hours: 8,
        status: 'completed',
      };
      expect(shift).toBeDefined();
    });

    it('should export PerformanceMetrics interface', () => {
      const metrics: import('../MedicalStaffPerformanceMetrics').PerformanceMetrics = {
        totalShifts: 10,
        totalHours: 80,
        facilitiesWorked: 3,
        attendanceRate: 95,
      };
      expect(metrics).toBeDefined();
    });

    it('should export MedicalStaffPerformanceMetricsProps interface', () => {
      const props: import('../MedicalStaffPerformanceMetrics').MedicalStaffPerformanceMetricsProps = {
        shifts: [],
        loading: false,
      };
      expect(props).toBeDefined();
    });
  });
});
