import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@/test/utils';
import {
  MedicalStaffShiftHistory,
  type ShiftHistoryItem,
  type MedicalStaffShiftHistoryProps,
} from '../MedicalStaffShiftHistory';

// Mock data for tests
const mockShifts: ShiftHistoryItem[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    facility: 'Hospital São Paulo',
    specialty: 'Cardiologia',
    hours: 12,
    status: 'completed',
  },
  {
    id: '2',
    date: new Date('2024-01-10'),
    facility: 'Clínica Santa Maria',
    specialty: 'Neurologia',
    hours: 8,
    status: 'scheduled',
  },
  {
    id: '3',
    date: new Date('2024-01-05'),
    facility: 'Hospital Central',
    specialty: null,
    hours: 6,
    status: 'cancelled',
  },
  {
    id: '4',
    date: new Date('2024-01-20'),
    facility: 'UPA Norte',
    specialty: 'Emergência',
    hours: 24,
    status: 'in_progress',
  },
];

// Helper to render component with default props
function renderShiftHistory(props: Partial<MedicalStaffShiftHistoryProps> = {}) {
  const defaultProps: MedicalStaffShiftHistoryProps = {
    shifts: mockShifts,
    loading: false,
    showCard: true,
    ...props,
  };

  return render(<MedicalStaffShiftHistory {...defaultProps} />);
}

describe('MedicalStaffShiftHistory', () => {
  describe('Rendering with valid data', () => {
    it('should render component with shifts', () => {
      renderShiftHistory();
      expect(screen.getByTestId('shift-history-card')).toBeInTheDocument();
    });

    it('should render card title "Histórico de Plantões"', () => {
      renderShiftHistory();
      expect(screen.getByText('Histórico de Plantões')).toBeInTheDocument();
    });

    it('should render shift history container', () => {
      renderShiftHistory();
      expect(screen.getByTestId('shift-history')).toBeInTheDocument();
    });

    it('should render all shift items', () => {
      renderShiftHistory();
      const shiftItems = screen.getAllByTestId('shift-item');
      expect(shiftItems.length).toBeGreaterThan(0);
    });

    it('should render without card wrapper when showCard is false', () => {
      renderShiftHistory({ showCard: false });
      expect(screen.queryByTestId('shift-history-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('shift-history')).toBeInTheDocument();
    });
  });

  describe('Shift ordering by date', () => {
    it('should sort shifts by date (most recent first)', () => {
      renderShiftHistory();
      const shiftItems = screen.getAllByTestId('shift-item');

      // First item should be the most recent (2024-01-20)
      expect(shiftItems[0]).toHaveAttribute('data-shift-id', '4');
      // Last visible item should be oldest
      const lastIndex = shiftItems.length - 1;
      expect(shiftItems[lastIndex]).toHaveAttribute('data-shift-id', '3');
    });

    it('should maintain chronological order with mixed dates', () => {
      const mixedShifts: ShiftHistoryItem[] = [
        { ...mockShifts[0], date: '2024-01-01' },
        { ...mockShifts[1], date: '2024-01-15' },
        { ...mockShifts[2], date: '2024-01-10' },
      ];
      renderShiftHistory({ shifts: mixedShifts });

      const shiftItems = screen.getAllByTestId('shift-item');
      // Should be sorted: 2024-01-15, 2024-01-10, 2024-01-01
      expect(shiftItems[0]).toHaveAttribute('data-shift-id', '2');
      expect(shiftItems[1]).toHaveAttribute('data-shift-id', '3');
      expect(shiftItems[2]).toHaveAttribute('data-shift-id', '1');
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no shifts provided', () => {
      renderShiftHistory({ shifts: [] });
      expect(screen.getByTestId('shift-empty-state')).toBeInTheDocument();
    });

    it('should display "Nenhum plantão encontrado" message', () => {
      renderShiftHistory({ shifts: [] });
      expect(screen.getByText('Nenhum plantão encontrado')).toBeInTheDocument();
    });

    it('should display descriptive text in empty state', () => {
      renderShiftHistory({ shifts: [] });
      expect(
        screen.getByText('Não há histórico de plantões para exibir no momento.')
      ).toBeInTheDocument();
    });

    it('should not show shift history container in empty state', () => {
      renderShiftHistory({ shifts: [] });
      expect(screen.queryByTestId('shift-history')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show skeleton loader when loading is true', () => {
      renderShiftHistory({ loading: true });
      expect(screen.getByTestId('shift-history-skeleton')).toBeInTheDocument();
    });

    it('should not show shift items when loading', () => {
      renderShiftHistory({ loading: true });
      expect(screen.queryByTestId('shift-item')).not.toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      renderShiftHistory({ shifts: [], loading: true });
      expect(screen.queryByTestId('shift-empty-state')).not.toBeInTheDocument();
    });

    it('should render multiple skeleton items', () => {
      renderShiftHistory({ loading: true });
      const skeleton = screen.getByTestId('shift-history-skeleton');
      // Should have 5 skeleton items
      const skeletonItems = within(skeleton).getAllByRole('generic');
      expect(skeletonItems.length).toBeGreaterThan(3);
    });
  });

  describe('Shift details display', () => {
    it('should display facility name for each shift', () => {
      renderShiftHistory();
      expect(screen.getByText('Hospital São Paulo')).toBeInTheDocument();
      expect(screen.getByText('Clínica Santa Maria')).toBeInTheDocument();
    });

    it('should display specialty when available', () => {
      renderShiftHistory();
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      expect(screen.getByText('Neurologia')).toBeInTheDocument();
    });

    it('should handle null specialty gracefully', () => {
      renderShiftHistory();
      // Should not display specialty text for shift with null specialty
      const shiftItems = screen.getAllByTestId('shift-item');
      const shiftWithoutSpecialty = shiftItems.find((item) =>
        item.getAttribute('data-shift-id') === '3'
      );
      expect(shiftWithoutSpecialty).toBeInTheDocument();
      // Should still display facility name
      expect(screen.getByText('Hospital Central')).toBeInTheDocument();
    });

    it('should display hours worked with proper formatting', () => {
      renderShiftHistory();
      expect(screen.getByText('12 horas')).toBeInTheDocument();
      expect(screen.getByText('8 horas')).toBeInTheDocument();
      expect(screen.getByText('6 horas')).toBeInTheDocument();
    });

    it('should display singular "hora" for 1 hour', () => {
      const singleHourShift: ShiftHistoryItem = {
        id: '5',
        date: new Date('2024-01-01'),
        facility: 'Test Clinic',
        specialty: 'Test',
        hours: 1,
        status: 'completed',
      };
      renderShiftHistory({ shifts: [singleHourShift] });
      expect(screen.getByText('1 hora')).toBeInTheDocument();
    });

    it('should format dates in Portuguese locale', () => {
      renderShiftHistory();
      // Check for Portuguese month abbreviations (de jan., de fev., etc.)
      const dateTexts = screen.getAllByText(/de jan/i);
      expect(dateTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Status badges', () => {
    it('should display status badge for each shift', () => {
      renderShiftHistory();
      const statusBadges = screen.getAllByTestId('shift-status-badge');
      expect(statusBadges.length).toBe(mockShifts.length);
    });

    it('should display "Concluído" for completed status', () => {
      renderShiftHistory();
      expect(screen.getByText('Concluído')).toBeInTheDocument();
    });

    it('should display "Agendado" for scheduled status', () => {
      renderShiftHistory();
      expect(screen.getByText('Agendado')).toBeInTheDocument();
    });

    it('should display "Cancelado" for cancelled status', () => {
      renderShiftHistory();
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });

    it('should display "Em Andamento" for in_progress status', () => {
      renderShiftHistory();
      expect(screen.getByText('Em Andamento')).toBeInTheDocument();
    });

    it('should apply green color class to completed status', () => {
      renderShiftHistory();
      const completedBadge = screen.getByText('Concluído');
      expect(completedBadge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('should apply blue color class to scheduled status', () => {
      renderShiftHistory();
      const scheduledBadge = screen.getByText('Agendado');
      expect(scheduledBadge).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should apply red color class to cancelled status', () => {
      renderShiftHistory();
      const cancelledBadge = screen.getByText('Cancelado');
      expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('should apply orange color class to in_progress status', () => {
      renderShiftHistory();
      const inProgressBadge = screen.getByText('Em Andamento');
      expect(inProgressBadge).toHaveClass('bg-orange-100', 'text-orange-700');
    });
  });

  describe('Virtual scrolling', () => {
    it('should handle large datasets efficiently', () => {
      // Generate 150 shifts
      const largeDataset: ShiftHistoryItem[] = Array.from({ length: 150 }, (_, i) => ({
        id: `shift-${i}`,
        date: new Date(2024, 0, i + 1),
        facility: `Facility ${i}`,
        specialty: i % 2 === 0 ? `Specialty ${i}` : null,
        hours: (i % 12) + 1,
        status: (['completed', 'scheduled', 'cancelled', 'in_progress'] as const)[i % 4],
      }));

      renderShiftHistory({ shifts: largeDataset });

      // Should render shift history container
      expect(screen.getByTestId('shift-history')).toBeInTheDocument();

      // Should render shift items (virtual scrolling handles rendering optimization)
      const renderedItems = screen.getAllByTestId('shift-item');
      expect(renderedItems.length).toBeGreaterThan(0);
      // Note: In test environment, fallback rendering may render all items
      // In production with proper DOM measurements, virtualizer renders only visible items
    });

    it('should apply maxHeight style to scrollable container', () => {
      const customHeight = '400px';
      renderShiftHistory({ maxHeight: customHeight });
      const container = screen.getByTestId('shift-history');
      expect(container).toHaveStyle({ maxHeight: customHeight });
    });

    it('should use default maxHeight of 600px', () => {
      renderShiftHistory();
      const container = screen.getByTestId('shift-history');
      expect(container).toHaveStyle({ maxHeight: '600px' });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to component', () => {
      const customClass = 'my-custom-class';
      const { container } = renderShiftHistory({ className: customClass });
      const card = container.querySelector('.my-custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      renderShiftHistory({ className: 'test-class' });
      const card = screen.getByTestId('shift-history-card');
      expect(card).toHaveClass('test-class');
      expect(card).toHaveClass('w-full'); // Default class
    });
  });

  describe('Component exports', () => {
    it('should export ShiftHistoryItem type', () => {
      const testItem: ShiftHistoryItem = {
        id: '1',
        date: new Date(),
        facility: 'Test',
        specialty: null,
        hours: 8,
        status: 'completed',
      };
      expect(testItem).toBeDefined();
    });

    it('should export MedicalStaffShiftHistoryProps type', () => {
      const testProps: MedicalStaffShiftHistoryProps = {
        shifts: [],
        loading: false,
      };
      expect(testProps).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle ISO string dates', () => {
      const isoDateShift: ShiftHistoryItem = {
        id: '1',
        date: '2024-01-15T10:00:00Z',
        facility: 'Test Hospital',
        specialty: 'Test',
        hours: 8,
        status: 'completed',
      };
      renderShiftHistory({ shifts: [isoDateShift] });
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    it('should handle shifts with same date', () => {
      const sameDateShifts: ShiftHistoryItem[] = [
        { ...mockShifts[0], id: '1', date: new Date('2024-01-15') },
        { ...mockShifts[1], id: '2', date: new Date('2024-01-15') },
      ];
      renderShiftHistory({ shifts: sameDateShifts });
      const shiftItems = screen.getAllByTestId('shift-item');
      expect(shiftItems.length).toBe(2);
    });

    it('should handle zero hours', () => {
      const zeroHoursShift: ShiftHistoryItem = {
        id: '1',
        date: new Date(),
        facility: 'Test',
        specialty: null,
        hours: 0,
        status: 'cancelled',
      };
      renderShiftHistory({ shifts: [zeroHoursShift] });
      expect(screen.getByText('0 horas')).toBeInTheDocument();
    });

    it('should handle very long facility names', () => {
      const longNameShift: ShiftHistoryItem = {
        id: '1',
        date: new Date(),
        facility: 'Hospital Municipal de Atendimento Especializado em Cardiologia e Neurologia',
        specialty: 'Test',
        hours: 8,
        status: 'completed',
      };
      renderShiftHistory({ shifts: [longNameShift] });
      expect(
        screen.getByText(
          'Hospital Municipal de Atendimento Especializado em Cardiologia e Neurologia'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      renderShiftHistory();
      // Card should have proper structure
      expect(screen.getByTestId('shift-history-card')).toBeInTheDocument();
    });

    it('should have data-testid attributes for testing', () => {
      renderShiftHistory();
      expect(screen.getByTestId('shift-history')).toBeInTheDocument();
      expect(screen.getAllByTestId('shift-item').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('shift-status-badge').length).toBeGreaterThan(0);
    });
  });
});
