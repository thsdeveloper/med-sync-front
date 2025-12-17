/**
 * TableCell Atom Component Tests
 *
 * Unit tests for the TableCell component covering rendering, alignment, and props.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableCell } from '../TableCell';
import { Table, TableBody, TableRow } from '@/components/ui/table';

describe('TableCell', () => {
  it('renders children correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Test Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with default left alignment', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Left Aligned</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Left Aligned').closest('td');
    expect(cell).toBeInTheDocument();
    expect(cell).not.toHaveClass('text-center');
    expect(cell).not.toHaveClass('text-right');
  });

  it('renders with center alignment when align="center"', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell align="center">Center Aligned</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Center Aligned').closest('td');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('text-center');
  });

  it('renders with right alignment when align="right"', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell align="right">Right Aligned</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Right Aligned').closest('td');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('text-right');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-bold text-red-500">Custom Style</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Custom Style').closest('td');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('font-bold');
    expect(cell).toHaveClass('text-red-500');
  });

  it('passes through HTML attributes', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="custom-cell" colSpan={2}>
              Spanning Cell
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByTestId('custom-cell');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('combines alignment and custom className correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell align="center" className="bg-blue-100">
              Combined Classes
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Combined Classes').closest('td');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('text-center');
    expect(cell).toHaveClass('bg-blue-100');
  });

  it('renders with React node children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <div className="flex items-center">
                <span>Icon</span>
                <span>Text</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('renders empty cell when no children provided', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="empty-cell" />
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByTestId('empty-cell');
    expect(cell).toBeInTheDocument();
    expect(cell).toBeEmptyDOMElement();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableCellElement | null };

    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell ref={ref}>Ref Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    expect(ref.current?.textContent).toBe('Ref Cell');
  });
});
