/**
 * TableHeader Atom Component Tests
 *
 * Unit tests for the TableHeader atom component covering rendering, alignment,
 * className application, and HTML attributes.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableRow } from '@/components/ui/table';
import { TableHeader } from '../TableHeader';

describe('TableHeader', () => {
  // Helper function to render TableHeader within proper table context
  const renderTableHeader = (ui: React.ReactElement) => {
    return render(
      <Table>
        <thead>
          <TableRow>{ui}</TableRow>
        </thead>
      </Table>
    );
  };

  describe('Rendering', () => {
    it('renders with text content', () => {
      renderTableHeader(<TableHeader>Column Name</TableHeader>);
      expect(screen.getByText('Column Name')).toBeInTheDocument();
    });

    it('renders with children components', () => {
      renderTableHeader(
        <TableHeader>
          <div data-testid="header-component">Header Component</div>
        </TableHeader>
      );
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
      expect(screen.getByText('Header Component')).toBeInTheDocument();
    });

    it('renders with numeric content', () => {
      renderTableHeader(<TableHeader>{100}</TableHeader>);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders with empty content', () => {
      renderTableHeader(<TableHeader />);
      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
      expect(header).toBeEmptyDOMElement();
    });

    it('renders with null content', () => {
      renderTableHeader(<TableHeader>{null}</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toBeEmptyDOMElement();
    });

    it('renders with React Fragment children', () => {
      renderTableHeader(
        <TableHeader>
          <>
            <span>Part 1</span>
            <span> Part 2</span>
          </>
        </TableHeader>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('applies left alignment by default', () => {
      renderTableHeader(<TableHeader>Left Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).not.toHaveClass('text-center');
      expect(header).not.toHaveClass('text-right');
    });

    it('applies center alignment when align="center"', () => {
      renderTableHeader(<TableHeader align="center">Centered</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('text-center');
    });

    it('applies right alignment when align="right"', () => {
      renderTableHeader(<TableHeader align="right">Right Aligned</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('text-right');
    });

    it('applies left alignment explicitly when align="left"', () => {
      renderTableHeader(<TableHeader align="left">Left Aligned</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).not.toHaveClass('text-center');
      expect(header).not.toHaveClass('text-right');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderTableHeader(<TableHeader className="custom-header">Name</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('custom-header');
    });

    it('combines custom className with alignment class', () => {
      renderTableHeader(
        <TableHeader align="center" className="font-semibold">
          Status
        </TableHeader>
      );
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('text-center');
      expect(header).toHaveClass('font-semibold');
    });

    it('applies multiple custom classes', () => {
      renderTableHeader(
        <TableHeader className="w-24 text-xs uppercase tracking-wide">
          ID
        </TableHeader>
      );
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('w-24');
      expect(header).toHaveClass('text-xs');
      expect(header).toHaveClass('uppercase');
      expect(header).toHaveClass('tracking-wide');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML attributes to header element', () => {
      renderTableHeader(<TableHeader data-testid="custom-header">Test</TableHeader>);
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('supports colSpan attribute', () => {
      renderTableHeader(<TableHeader colSpan={3}>Wide Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('colspan', '3');
    });

    it('supports rowSpan attribute', () => {
      renderTableHeader(<TableHeader rowSpan={2}>Tall Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('rowspan', '2');
    });

    it('supports custom data attributes', () => {
      renderTableHeader(
        <TableHeader data-column-id="user-name">Name</TableHeader>
      );
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('data-column-id', 'user-name');
    });

    it('supports aria attributes for accessibility', () => {
      renderTableHeader(
        <TableHeader aria-sort="ascending">Sortable Column</TableHeader>
      );
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('aria-sort', 'ascending');
    });

    it('supports scope attribute for accessibility', () => {
      renderTableHeader(<TableHeader scope="col">Column Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('scope', 'col');
    });

    it('supports title attribute', () => {
      renderTableHeader(<TableHeader title="Tooltip text">Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('title', 'Tooltip text');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to th element', () => {
      const ref = { current: null as HTMLTableCellElement | null };

      render(
        <Table>
          <thead>
            <TableRow>
              <TableHeader ref={ref}>Header</TableHeader>
            </TableRow>
          </thead>
        </Table>
      );

      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
      expect(ref.current?.tagName).toBe('TH');
    });

    it('allows ref access to header properties', () => {
      const ref = { current: null as HTMLTableCellElement | null };

      render(
        <Table>
          <thead>
            <TableRow>
              <TableHeader ref={ref} colSpan={2}>
                Wide Header
              </TableHeader>
            </TableRow>
          </thead>
        </Table>
      );

      expect(ref.current?.colSpan).toBe(2);
    });
  });

  describe('Display Name', () => {
    it('has correct displayName for debugging', () => {
      expect(TableHeader.displayName).toBe('TableHeader');
    });
  });

  describe('Edge Cases', () => {
    it('renders with very long text content', () => {
      const longText = 'A'.repeat(500);
      renderTableHeader(<TableHeader>{longText}</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header.textContent).toBe(longText);
    });

    it('renders with special characters', () => {
      renderTableHeader(<TableHeader>{'<>&"\'`'}</TableHeader>);
      expect(screen.getByText('<>&"\'`')).toBeInTheDocument();
    });

    it('renders with HTML entities', () => {
      renderTableHeader(<TableHeader>{'# ¬ £ ¥'}</TableHeader>);
      expect(screen.getByText('# ¬ £ ¥')).toBeInTheDocument();
    });

    it('renders with emoji', () => {
      renderTableHeader(<TableHeader>{'=Ê Data'}</TableHeader>);
      expect(screen.getByText('=Ê Data')).toBeInTheDocument();
    });

    it('handles className as empty string', () => {
      renderTableHeader(<TableHeader className="">Header</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
    });

    it('renders with complex nested structure', () => {
      renderTableHeader(
        <TableHeader>
          <div className="flex items-center gap-2">
            <span>Icon</span>
            <span>Label</span>
            <button type="button">Sort</button>
          </div>
        </TableHeader>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as th element for proper semantics', () => {
      renderTableHeader(<TableHeader>Column</TableHeader>);
      const header = screen.getByRole('columnheader');
      expect(header.tagName).toBe('TH');
    });

    it('can be accessed by role', () => {
      renderTableHeader(<TableHeader>Accessible Header</TableHeader>);
      expect(screen.getByRole('columnheader')).toHaveTextContent('Accessible Header');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('accepts valid th HTML attributes', () => {
      // This test verifies TypeScript compilation
      renderTableHeader(
        <TableHeader
          id="header-id"
          title="Header Title"
          className="custom"
          colSpan={2}
          rowSpan={1}
          scope="col"
          abbr="Abbreviation"
        >
          Type-safe Header
        </TableHeader>
      );

      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('id', 'header-id');
      expect(header).toHaveAttribute('title', 'Header Title');
      expect(header).toHaveAttribute('scope', 'col');
    });
  });
});
