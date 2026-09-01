'use client';

import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DataTable<T>({
  table,
  isLoading,
  isError,
  errorMessage = 'Failed to load data.',
  emptyMessage = 'No results.',
  columnCount,
}: {
  table: TanStackTable<T>;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  columnCount: number;
}) {
  const rows = table.getRowModel().rows;
  const message = isError
    ? errorMessage
    : isLoading
      ? 'Loading...'
      : emptyMessage;
  const showPlaceholder = isLoading || isError || rows.length === 0;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={
                      canSort ? 'cursor-pointer select-none' : undefined
                    }
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {showPlaceholder ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className={`p-6 text-center text-muted-foreground ${isError ? 'text-destructive' : ''}`}
              >
                {message}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function TablePagination({
  pageIndex,
  totalPages,
  total,
  onPrevious,
  onNext,
}: {
  pageIndex: number;
  totalPages: number;
  total?: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={pageIndex === 0}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {pageIndex + 1} of {Math.max(totalPages, 1)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={pageIndex >= totalPages - 1}
      >
        Next
      </Button>
      {total !== undefined && (
        <span className="ml-4 text-sm text-muted-foreground">
          {total} total
        </span>
      )}
    </div>
  );
}
