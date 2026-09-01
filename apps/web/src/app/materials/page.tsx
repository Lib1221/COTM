'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/use-debounce';
import type { Material, PaginatedResponse } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, TablePagination } from '@/components/data-table';
import { cn } from '@/lib/utils';

export default function MaterialsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'materials',
      { search: debouncedSearch, lowStockOnly, sorting, pageIndex, pageSize },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (lowStockOnly) params.set('lowStock', 'true');
      const sort = sorting[0];
      if (sort) {
        params.set('sortBy', sort.id);
        params.set('sortOrder', sort.desc ? 'desc' : 'asc');
      }
      return api.get<PaginatedResponse<Material>>(`/materials?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const columnHelper = createColumnHelper<Material>();
  const columns = [
    columnHelper.accessor('code', {
      header: 'Code',
      cell: (i) => i.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (i) => i.getValue(),
    }),
    columnHelper.accessor('unit', {
      header: 'Unit',
      cell: (i) => i.getValue(),
    }),
    columnHelper.accessor('currentStock', {
      header: 'Current Stock',
      cell: (i) => Number(i.getValue()),
    }),
    columnHelper.accessor('minimumStock', {
      header: 'Min Stock',
      cell: (i) => Number(i.getValue()),
    }),
    columnHelper.accessor('isLowStock', {
      header: 'Status',
      enableSorting: false,
      cell: (i) =>
        i.getValue() ? (
          <Badge variant="warning">Low Stock</Badge>
        ) : (
          <Badge variant="success">In Stock</Badge>
        ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: (i) => (
        <div className="flex gap-1">
          <Link
            href={`/materials/${i.row.original.id}/edit`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Edit
          </Link>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm(`Delete material "${i.row.original.name}"?`))
                deleteMutation.mutate(i.row.original.id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.meta.totalPages ?? -1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materials</h1>
        <Link
          href="/materials/new"
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          New Material
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          Low stock only
        </label>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message ?? 'Failed to load materials.'}
        emptyMessage="No materials found."
      />

      <TablePagination
        pageIndex={pageIndex}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPrevious={() => table.previousPage()}
        onNext={() => table.nextPage()}
      />
    </div>
  );
}
