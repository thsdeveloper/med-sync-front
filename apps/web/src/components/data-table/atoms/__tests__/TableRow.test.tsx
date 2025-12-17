/**
 * TableRow Atom Component Tests
 *
 * Unit tests for the TableRow atom component covering rendering, interactivity,
 * selection states, and event handlers.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, TableBody } from '@/components/ui/table';
import { TableRow } from '../TableRow';
import { TableCell } from '../TableCell';

describe('TableRow', () => {
  // Helper function to render TableRow within proper table context
  const renderTableRow = (ui: React.ReactElement) => {
    return render(
      <Table>
        <TableBody>{ui}</TableBody>
      </Table>
    );
  };

  describe('Rendering', () => {
    it('renders with children cells', () => {
      renderTableRow(
        <TableRow>
          <TableCell>Cell 1</TableCell>
          <TableCell>Cell 2</TableCell>
        </TableRow>
      );

      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });

    it('renders as a table row element', () => {
      renderTableRow(
        <TableRow data-testid="test-row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('test-row');
      expect(row.tagName).toBe('TR');
    });

    it('renders with multiple cells', () => {
      renderTableRow(
        <TableRow>
          <TableCell>Col 1</TableCell>
          <TableCell>Col 2</TableCell>
          <TableCell>Col 3</TableCell>
          <TableCell>Col 4</TableCell>
        </TableRow>
      );

      expect(screen.getByText('Col 1')).toBeInTheDocument();
      expect(screen.getByText('Col 2')).toBeInTheDocument();
      expect(screen.getByText('Col 3')).toBeInTheDocument();
      expect(screen.getByText('Col 4')).toBeInTheDocument();
    });

    it('renders with empty row', () => {
      renderTableRow(<TableRow data-testid="empty-row" />);
      const row = screen.getByTestId('empty-row');
      expect(row).toBeInTheDocument();
      expect(row).toBeEmptyDOMElement();
    });
  });

  describe('Selection State', () => {
    it('does not apply selected styles by default', () => {
      renderTableRow(
        <TableRow data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).not.toHaveClass('bg-muted');
      expect(row).not.toHaveAttribute('data-state', 'selected');
    });

    it('applies selected styles when selected=true', () => {
      renderTableRow(
        <TableRow selected={true} data-testid="selected-row">
          <TableCell>Selected</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('selected-row');
      expect(row).toHaveClass('bg-muted');
      expect(row).toHaveAttribute('data-state', 'selected');
    });

    it('removes selected styles when selected=false', () => {
      renderTableRow(
        <TableRow selected={false} data-testid="not-selected">
          <TableCell>Not Selected</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('not-selected');
      expect(row).not.toHaveClass('bg-muted');
      expect(row).not.toHaveAttribute('data-state', 'selected');
    });
  });

  describe('Clickable State', () => {
    it('does not apply cursor-pointer by default', () => {
      renderTableRow(
        <TableRow data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).not.toHaveClass('cursor-pointer');
    });

    it('applies cursor-pointer when clickable=true', () => {
      renderTableRow(
        <TableRow clickable={true} data-testid="clickable-row">
          <TableCell>Clickable</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('clickable-row');
      expect(row).toHaveClass('cursor-pointer');
    });

    it('does not apply cursor-pointer when clickable=false', () => {
      renderTableRow(
        <TableRow clickable={false} data-testid="not-clickable">
          <TableCell>Not Clickable</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('not-clickable');
      expect(row).not.toHaveClass('cursor-pointer');
    });
  });

  describe('onClick Handler', () => {
    it('calls onClick when row is clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow onClick={handleClick} data-testid="clickable-row">
          <TableCell>Click me</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('clickable-row');
      await user.click(row);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with event object', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow onClick={handleClick} data-testid="clickable-row">
          <TableCell>Click me</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('clickable-row');
      await user.click(row);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
      expect(handleClick.mock.calls[0][0]).toHaveProperty('type', 'click');
    });

    it('does not call onClick when not provided', async () => {
      const user = userEvent.setup();

      renderTableRow(
        <TableRow data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      await user.click(row);

      // Should not throw error
      expect(row).toBeInTheDocument();
    });

    it('calls onClick multiple times for multiple clicks', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow onClick={handleClick} data-testid="clickable-row">
          <TableCell>Click me</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('clickable-row');
      await user.click(row);
      await user.click(row);
      await user.click(row);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderTableRow(
        <TableRow className="custom-row-class" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('custom-row-class');
    });

    it('combines custom className with clickable class', () => {
      renderTableRow(
        <TableRow clickable={true} className="bg-blue-50" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('cursor-pointer');
      expect(row).toHaveClass('bg-blue-50');
    });

    it('combines custom className with selected class', () => {
      renderTableRow(
        <TableRow selected={true} className="font-bold" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('bg-muted');
      expect(row).toHaveClass('font-bold');
    });

    it('combines all classes together', () => {
      renderTableRow(
        <TableRow
          clickable={true}
          selected={true}
          className="border-t"
          data-testid="row"
        >
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('cursor-pointer');
      expect(row).toHaveClass('bg-muted');
      expect(row).toHaveClass('border-t');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML attributes to row element', () => {
      renderTableRow(
        <TableRow data-testid="custom-row" data-row-id="123">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('custom-row');
      expect(row).toHaveAttribute('data-row-id', '123');
    });

    it('supports aria attributes', () => {
      renderTableRow(
        <TableRow aria-label="User row" data-testid="row">
          <TableCell>User</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveAttribute('aria-label', 'User row');
    });

    it('supports role attribute', () => {
      renderTableRow(
        <TableRow role="row" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveAttribute('role', 'row');
    });

    it('supports title attribute', () => {
      renderTableRow(
        <TableRow title="Row tooltip" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveAttribute('title', 'Row tooltip');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to tr element', () => {
      const ref = { current: null as HTMLTableRowElement | null };

      render(
        <Table>
          <TableBody>
            <TableRow ref={ref}>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
      expect(ref.current?.tagName).toBe('TR');
    });

    it('allows ref access to row properties', () => {
      const ref = { current: null as HTMLTableRowElement | null };

      render(
        <Table>
          <TableBody>
            <TableRow ref={ref}>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(ref.current?.cells.length).toBe(2);
    });
  });

  describe('Display Name', () => {
    it('has correct displayName for debugging', () => {
      expect(TableRow.displayName).toBe('TableRow');
    });
  });

  describe('Combination States', () => {
    it('works with clickable and onClick together', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow clickable={true} onClick={handleClick} data-testid="row">
          <TableCell>Interactive Row</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('cursor-pointer');

      await user.click(row);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('works with selected and clickable together', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow
          selected={true}
          clickable={true}
          onClick={handleClick}
          data-testid="row"
        >
          <TableCell>Selected and Clickable</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toHaveClass('bg-muted');
      expect(row).toHaveClass('cursor-pointer');

      await user.click(row);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid multiple clicks', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderTableRow(
        <TableRow onClick={handleClick} data-testid="row">
          <TableCell>Rapid clicks</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      await user.tripleClick(row);

      expect(handleClick).toHaveBeenCalled();
    });

    it('handles className as empty string', () => {
      renderTableRow(
        <TableRow className="" data-testid="row">
          <TableCell>Content</TableCell>
        </TableRow>
      );

      const row = screen.getByTestId('row');
      expect(row).toBeInTheDocument();
    });

    it('renders with complex children structure', () => {
      renderTableRow(
        <TableRow>
          <TableCell>
            <div>
              <span>Nested</span>
              <button type="button">Button</button>
            </div>
          </TableCell>
          <TableCell>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </TableCell>
        </TableRow>
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('accepts valid tr HTML attributes', () => {
      renderTableRow(
        <TableRow
          id="row-123"
          className="custom"
          data-index={0}
          aria-selected={true}
        >
          <TableCell>Type-safe Row</TableCell>
        </TableRow>
      );

      const row = screen.getByText('Type-safe Row').closest('tr');
      expect(row).toHaveAttribute('id', 'row-123');
      expect(row).toHaveAttribute('aria-selected', 'true');
    });
  });
});
