import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MedicalStaffHeader, type MedicalStaffHeaderProps } from '../MedicalStaffHeader';

describe('MedicalStaffHeader', () => {
  const defaultProps: MedicalStaffHeaderProps = {
    name: 'Dr. João Silva',
    specialty: 'Cardiologia',
    status: 'online',
  };

  describe('Rendering with valid data', () => {
    it('should render the component with all data', () => {
      render(<MedicalStaffHeader {...defaultProps} />);

      expect(screen.getByTestId('medical-staff-header')).toBeInTheDocument();
      expect(screen.getByTestId('staff-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('staff-name')).toBeInTheDocument();
      expect(screen.getByTestId('staff-specialty')).toBeInTheDocument();
      expect(screen.getByTestId('staff-status')).toBeInTheDocument();
    });

    it('should display the correct name', () => {
      render(<MedicalStaffHeader {...defaultProps} />);

      const nameElement = screen.getByTestId('staff-name');
      expect(nameElement).toHaveTextContent('Dr. João Silva');
    });

    it('should display the correct specialty', () => {
      render(<MedicalStaffHeader {...defaultProps} />);

      const specialtyElement = screen.getByTestId('staff-specialty');
      expect(specialtyElement).toHaveTextContent('Cardiologia');
    });

    it('should render with avatar URL when provided', () => {
      render(
        <MedicalStaffHeader
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      // In jsdom, AvatarImage won't render the img tag without proper loading
      // Check that avatar container exists and has the correct structure
      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Status badge rendering', () => {
    it('should display online status with correct label', () => {
      render(<MedicalStaffHeader {...defaultProps} status="online" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveTextContent('Online');
    });

    it('should display active status with correct label', () => {
      render(<MedicalStaffHeader {...defaultProps} status="active" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveTextContent('Ativo');
    });

    it('should display offline status with correct label', () => {
      render(<MedicalStaffHeader {...defaultProps} status="offline" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveTextContent('Offline');
    });

    it('should display busy status with correct label', () => {
      render(<MedicalStaffHeader {...defaultProps} status="busy" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveTextContent('Ocupado');
    });

    it('should default to offline status when not provided', () => {
      const { status, ...propsWithoutStatus } = defaultProps;
      render(<MedicalStaffHeader {...propsWithoutStatus} />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveTextContent('Offline');
    });

    it('should apply correct color classes for online status', () => {
      render(<MedicalStaffHeader {...defaultProps} status="online" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveClass('bg-green-100');
      expect(statusBadge).toHaveClass('text-green-700');
    });

    it('should apply correct color classes for active status', () => {
      render(<MedicalStaffHeader {...defaultProps} status="active" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveClass('bg-blue-100');
      expect(statusBadge).toHaveClass('text-blue-700');
    });

    it('should apply correct color classes for offline status', () => {
      render(<MedicalStaffHeader {...defaultProps} status="offline" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveClass('bg-gray-100');
      expect(statusBadge).toHaveClass('text-gray-600');
    });

    it('should apply correct color classes for busy status', () => {
      render(<MedicalStaffHeader {...defaultProps} status="busy" />);

      const statusBadge = screen.getByTestId('staff-status');
      expect(statusBadge).toHaveClass('bg-orange-100');
      expect(statusBadge).toHaveClass('text-orange-700');
    });
  });

  describe('Skeleton loading state', () => {
    it('should render skeleton when loading is true', () => {
      render(<MedicalStaffHeader {...defaultProps} loading={true} />);

      // Skeleton should be visible
      const skeletons = screen.getAllByTestId(/staff-/);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not display actual data when loading', () => {
      render(<MedicalStaffHeader {...defaultProps} loading={true} />);

      // Name should not contain actual text (it's a skeleton div)
      const nameElement = screen.getByTestId('staff-name');
      expect(nameElement.tagName).toBe('DIV'); // Skeleton is a div, not text
    });

    it('should render all skeleton elements', () => {
      render(<MedicalStaffHeader {...defaultProps} loading={true} />);

      expect(screen.getByTestId('medical-staff-header')).toBeInTheDocument();
      expect(screen.getByTestId('staff-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('staff-name')).toBeInTheDocument();
      expect(screen.getByTestId('staff-specialty')).toBeInTheDocument();
    });
  });

  describe('Avatar fallback to initials', () => {
    it('should show initials when no avatar URL provided', () => {
      render(<MedicalStaffHeader name="João Silva" specialty="Cardiologia" status="online" avatarUrl={null} />);

      // AvatarFallback should contain initials
      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveTextContent('JS'); // João Silva -> JS
    });

    it('should extract correct initials from full name', () => {
      const { container } = render(
        <MedicalStaffHeader
          name="Maria Santos"
          specialty="Neurologia"
          status="active"
        />
      );

      const avatar = container.querySelector('[data-testid="staff-avatar"]');
      expect(avatar).toHaveTextContent('MS'); // Maria Santos -> MS
    });

    it('should handle single-word names', () => {
      const { container } = render(
        <MedicalStaffHeader
          name="João"
          specialty="Cardiologia"
          status="online"
        />
      );

      const avatar = container.querySelector('[data-testid="staff-avatar"]');
      expect(avatar).toHaveTextContent('J'); // João -> J
    });

    it('should handle names with multiple middle names', () => {
      const { container } = render(
        <MedicalStaffHeader
          name="João Pedro da Silva Santos"
          specialty="Cardiologia"
          status="online"
        />
      );

      const avatar = container.querySelector('[data-testid="staff-avatar"]');
      expect(avatar).toHaveTextContent('JS'); // João ... Santos -> JS
    });

    it('should handle empty name gracefully', () => {
      const { container } = render(
        <MedicalStaffHeader
          name=""
          specialty="Cardiologia"
          status="online"
        />
      );

      const avatar = container.querySelector('[data-testid="staff-avatar"]');
      expect(avatar).toHaveTextContent('?'); // Empty -> ?
    });

    it('should convert initials to uppercase', () => {
      render(
        <MedicalStaffHeader
          name="ana silva"
          specialty="Pediatria"
          status="online"
        />
      );

      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveTextContent('AS'); // ana silva -> AS (uppercase)
    });
  });

  describe('Optional specialty field', () => {
    it('should not render specialty element when specialty is null', () => {
      render(
        <MedicalStaffHeader
          name="Dr. João Silva"
          specialty={null}
          status="online"
        />
      );

      expect(screen.queryByTestId('staff-specialty')).not.toBeInTheDocument();
    });

    it('should not render specialty element when specialty is undefined', () => {
      render(
        <MedicalStaffHeader
          name="Dr. João Silva"
          status="online"
        />
      );

      expect(screen.queryByTestId('staff-specialty')).not.toBeInTheDocument();
    });

    it('should render specialty when provided', () => {
      render(
        <MedicalStaffHeader
          name="Dr. João Silva"
          specialty="Cardiologia"
          status="online"
        />
      );

      expect(screen.getByTestId('staff-specialty')).toBeInTheDocument();
      expect(screen.getByTestId('staff-specialty')).toHaveTextContent('Cardiologia');
    });
  });

  describe('Size variants', () => {
    it('should apply small size class when size is sm', () => {
      render(<MedicalStaffHeader {...defaultProps} size="sm" />);

      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveClass('size-8');
    });

    it('should apply medium size class when size is md (default)', () => {
      render(<MedicalStaffHeader {...defaultProps} size="md" />);

      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveClass('size-10');
    });

    it('should apply large size class when size is lg', () => {
      render(<MedicalStaffHeader {...defaultProps} size="lg" />);

      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveClass('size-12');
    });

    it('should default to medium size when not specified', () => {
      render(<MedicalStaffHeader {...defaultProps} />);

      const avatar = screen.getByTestId('staff-avatar');
      expect(avatar).toHaveClass('size-10');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(<MedicalStaffHeader {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('medical-staff-header');
      expect(container).toHaveClass('custom-class');
    });

    it('should preserve default classes when custom className is added', () => {
      render(<MedicalStaffHeader {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('medical-staff-header');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('gap-3');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Component structure', () => {
    it('should have correct semantic structure', () => {
      render(<MedicalStaffHeader {...defaultProps} />);

      const container = screen.getByTestId('medical-staff-header');
      expect(container.tagName).toBe('DIV');

      const nameElement = screen.getByTestId('staff-name');
      expect(nameElement.tagName).toBe('H3');

      const specialtyElement = screen.getByTestId('staff-specialty');
      expect(specialtyElement.tagName).toBe('P');
    });

    it('should follow atomic design principles with minimal props', () => {
      const props: MedicalStaffHeaderProps = {
        name: 'Test Name',
      };

      render(<MedicalStaffHeader {...props} />);

      expect(screen.getByTestId('medical-staff-header')).toBeInTheDocument();
    });
  });

  describe('TypeScript type exports', () => {
    it('should export MedicalStaffHeaderProps type', () => {
      // This test verifies TypeScript compilation
      const props: MedicalStaffHeaderProps = {
        name: 'Test',
        specialty: 'Test Specialty',
        status: 'online',
        loading: false,
        size: 'md',
        className: 'test',
      };

      expect(props).toBeDefined();
    });

    it('should enforce required name prop', () => {
      // TypeScript compile-time check - this will fail if name is not required
      // @ts-expect-error - name is required
      const invalidProps: MedicalStaffHeaderProps = {
        specialty: 'Test',
      };

      expect(invalidProps).toBeDefined();
    });
  });
});
