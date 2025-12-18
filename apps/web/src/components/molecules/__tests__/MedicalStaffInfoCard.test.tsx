import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MedicalStaffInfoCard } from '../MedicalStaffInfoCard';
import type { InfoSection } from '../MedicalStaffInfoCard';
import { Mail, Phone, Award, FileText, MapPin, Calendar } from 'lucide-react';

describe('MedicalStaffInfoCard', () => {
  const mockSections: InfoSection[] = [
    {
      title: 'Informações de Contato',
      rows: [
        {
          icon: Mail,
          label: 'E-mail',
          value: 'dr.silva@example.com',
        },
        {
          icon: Phone,
          label: 'Telefone',
          value: '(11) 98765-4321',
        },
      ],
    },
    {
      title: 'Detalhes Profissionais',
      rows: [
        {
          icon: Award,
          label: 'CRM',
          value: '123456-SP',
        },
        {
          icon: FileText,
          label: 'Especialidade',
          value: 'Cardiologia',
        },
      ],
    },
    {
      title: 'Documentos',
      rows: [
        {
          icon: FileText,
          label: 'RG',
          value: '12.345.678-9',
        },
        {
          icon: FileText,
          label: 'CPF',
          value: '123.456.789-00',
        },
      ],
    },
  ];

  describe('Rendering with valid data', () => {
    it('should render the component with data-testid', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const card = screen.getByTestId('info-card');
      expect(card).toBeInTheDocument();
    });

    it('should render all provided sections', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const sections = screen.getAllByTestId('info-section');
      expect(sections).toHaveLength(3);
    });

    it('should render section titles correctly', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      expect(screen.getByText('Informações de Contato')).toBeInTheDocument();
      expect(screen.getByText('Detalhes Profissionais')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });

    it('should render all information rows', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      // Total rows: 2 + 2 + 2 = 6
      const rows = screen.getAllByTestId('info-row');
      expect(rows).toHaveLength(6);
    });

    it('should render row labels and values', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      expect(screen.getByText('E-mail')).toBeInTheDocument();
      expect(screen.getByText('dr.silva@example.com')).toBeInTheDocument();
      expect(screen.getByText('Telefone')).toBeInTheDocument();
      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
      expect(screen.getByText('CRM')).toBeInTheDocument();
      expect(screen.getByText('123456-SP')).toBeInTheDocument();
    });

    it('should render optional card title when provided', () => {
      render(
        <MedicalStaffInfoCard
          sections={mockSections}
          title="Informações do Profissional"
        />
      );

      expect(screen.getByText('Informações do Profissional')).toBeInTheDocument();
    });

    it('should not render card title when not provided', () => {
      const { container } = render(<MedicalStaffInfoCard sections={mockSections} />);

      // CardHeader should not be present
      const cardHeader = container.querySelector('[class*="CardHeader"]');
      expect(cardHeader).not.toBeInTheDocument();
    });
  });

  describe('Icon rendering', () => {
    it('should render icons for all rows', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const icons = screen.getAllByTestId('info-row-icon');
      expect(icons).toHaveLength(6);
    });

    it('should render icons with correct accessibility attributes', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const icons = screen.getAllByTestId('info-row-icon');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should render icons with proper styling classes', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const icons = screen.getAllByTestId('info-row-icon');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('h-5', 'w-5', 'shrink-0', 'text-gray-500');
      });
    });
  });

  describe('Responsive grid layout', () => {
    it('should apply responsive grid classes to row containers', () => {
      const { container } = render(<MedicalStaffInfoCard sections={mockSections} />);

      // Find all grid containers
      const gridContainers = container.querySelectorAll('.grid');
      expect(gridContainers.length).toBeGreaterThan(0);

      // Check first grid container has responsive classes
      const firstGrid = gridContainers[0];
      expect(firstGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should render rows in a grid layout', () => {
      const { container } = render(<MedicalStaffInfoCard sections={mockSections} />);

      const gridContainers = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainers.length).toBe(3); // One grid per section
    });
  });

  describe('Skeleton loading state', () => {
    it('should render skeleton loaders when loading is true', () => {
      const { container } = render(
        <MedicalStaffInfoCard sections={[]} loading={true} />
      );

      // Skeleton components should be present
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render info-card testid even in loading state', () => {
      render(<MedicalStaffInfoCard sections={[]} loading={true} />);

      const card = screen.getByTestId('info-card');
      expect(card).toBeInTheDocument();
    });

    it('should not render actual sections when loading', () => {
      render(<MedicalStaffInfoCard sections={mockSections} loading={true} />);

      const sections = screen.queryAllByTestId('info-section');
      expect(sections).toHaveLength(0);
    });

    it('should render skeleton for card title when loading and title provided', () => {
      const { container } = render(
        <MedicalStaffInfoCard
          sections={[]}
          loading={true}
          title="Informações do Profissional"
        />
      );

      // Skeleton should be in CardHeader
      const cardHeader = container.querySelector('[class*="space-y"]');
      expect(cardHeader).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty state message when no sections provided', () => {
      render(<MedicalStaffInfoCard sections={[]} />);

      expect(screen.getByTestId('info-card-empty')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma informação disponível')).toBeInTheDocument();
    });

    it('should not render empty state when loading', () => {
      render(<MedicalStaffInfoCard sections={[]} loading={true} />);

      const emptyState = screen.queryByTestId('info-card-empty');
      expect(emptyState).not.toBeInTheDocument();
    });

    it('should not render empty state when sections are provided', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      const emptyState = screen.queryByTestId('info-card-empty');
      expect(emptyState).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to the card', () => {
      const { container } = render(
        <MedicalStaffInfoCard sections={mockSections} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      render(
        <MedicalStaffInfoCard sections={mockSections} className="custom-class" />
      );

      const card = screen.getByTestId('info-card');
      expect(card).toHaveClass('w-full', 'custom-class');
    });
  });

  describe('Value rendering', () => {
    it('should render string values correctly', () => {
      render(<MedicalStaffInfoCard sections={mockSections} />);

      expect(screen.getByText('dr.silva@example.com')).toBeInTheDocument();
    });

    it('should render number values correctly', () => {
      const sectionsWithNumber: InfoSection[] = [
        {
          title: 'Dados',
          rows: [
            {
              icon: Calendar,
              label: 'Anos de experiência',
              value: 15,
            },
          ],
        },
      ];

      render(<MedicalStaffInfoCard sections={sectionsWithNumber} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should render React node values correctly', () => {
      const sectionsWithNode: InfoSection[] = [
        {
          title: 'Dados',
          rows: [
            {
              icon: MapPin,
              label: 'Endereço',
              value: (
                <span className="custom-node">
                  Rua Exemplo, 123 - São Paulo
                </span>
              ),
            },
          ],
        },
      ];

      render(<MedicalStaffInfoCard sections={sectionsWithNode} />);

      expect(screen.getByText('Rua Exemplo, 123 - São Paulo')).toBeInTheDocument();
      const customNode = screen.getByText('Rua Exemplo, 123 - São Paulo');
      expect(customNode).toHaveClass('custom-node');
    });

    it('should render em dash for empty/null values', () => {
      const sectionsWithEmptyValue: InfoSection[] = [
        {
          title: 'Dados',
          rows: [
            {
              icon: Phone,
              label: 'Telefone alternativo',
              value: '',
            },
          ],
        },
      ];

      render(<MedicalStaffInfoCard sections={sectionsWithEmptyValue} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Section keys', () => {
    it('should use provided section keys when available', () => {
      const sectionsWithKeys: InfoSection[] = [
        {
          key: 'contact-section',
          title: 'Contato',
          rows: [
            {
              icon: Mail,
              label: 'E-mail',
              value: 'test@example.com',
            },
          ],
        },
      ];

      const { container } = render(
        <MedicalStaffInfoCard sections={sectionsWithKeys} />
      );

      // Check that section is rendered (key used internally)
      const section = container.querySelector('[data-testid="info-section"]');
      expect(section).toBeInTheDocument();
    });

    it('should use provided row keys when available', () => {
      const sectionsWithRowKeys: InfoSection[] = [
        {
          title: 'Contato',
          rows: [
            {
              key: 'email-row',
              icon: Mail,
              label: 'E-mail',
              value: 'test@example.com',
            },
          ],
        },
      ];

      render(<MedicalStaffInfoCard sections={sectionsWithRowKeys} />);

      // Check that row is rendered (key used internally)
      const row = screen.getByTestId('info-row');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic h3 for section titles', () => {
      const { container } = render(<MedicalStaffInfoCard sections={mockSections} />);

      const sectionTitles = container.querySelectorAll('h3');
      expect(sectionTitles).toHaveLength(3);
    });

    it('should use dl/dt/dd structure for information rows', () => {
      const { container } = render(<MedicalStaffInfoCard sections={mockSections} />);

      const labels = container.querySelectorAll('dt');
      const values = container.querySelectorAll('dd');

      expect(labels.length).toBeGreaterThan(0);
      expect(values.length).toBeGreaterThan(0);
      expect(labels.length).toBe(values.length);
    });
  });

  describe('TypeScript type exports', () => {
    it('should export InfoRow type', () => {
      const row: import('../MedicalStaffInfoCard').InfoRow = {
        icon: Mail,
        label: 'Test',
        value: 'Value',
      };

      expect(row).toBeDefined();
    });

    it('should export InfoSection type', () => {
      const section: import('../MedicalStaffInfoCard').InfoSection = {
        title: 'Test Section',
        rows: [],
      };

      expect(section).toBeDefined();
    });

    it('should export MedicalStaffInfoCardProps type', () => {
      const props: import('../MedicalStaffInfoCard').MedicalStaffInfoCardProps = {
        sections: [],
      };

      expect(props).toBeDefined();
    });
  });
});
