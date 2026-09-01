'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/use-debounce';
import type {
  InventoryTransaction,
  Material,
  Project,
  PaginatedResponse,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination } from '@/components/data-table';
import { formatDate } from '@/lib/utils';

const stockInSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  reference: z.string().max(200).optional(),
});
type StockInValues = z.infer<typeof stockInSchema>;

const stockOutSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  projectId: z.string().min(1, 'Project is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  reference: z.string().max(200).optional(),
});
type StockOutValues = z.infer<typeof stockOutSchema>;

const columnHelper = createColumnHelper<InventoryTransaction>();

const columns = [
  columnHelper.accessor('date', {
    header: 'Date',
    cell: (i) => formatDate(i.getValue()),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (i) =>
      i.getValue() === 'STOCK_IN' ? (
        <Badge variant="success">Stock In</Badge>
      ) : (
        <Badge variant="warning">Stock Out</Badge>
      ),
  }),
  columnHelper.accessor('material', {
    id: 'material',
    header: 'Material',
    cell: (i) => i.row.original.material?.name ?? '-',
  }),
  columnHelper.accessor('project', {
    id: 'project',
    header: 'Project',
    cell: (i) => i.row.original.project?.name ?? '-',
  }),
  columnHelper.accessor('quantity', {
    header: 'Quantity',
    cell: (i) => `${i.getValue()} ${i.row.original.material?.unit ?? ''}`,
  }),
  columnHelper.accessor('reference', {
    header: 'Reference',
    enableSorting: false,
    cell: (i) => i.getValue() ?? '-',
  }),
];

export default function InventoryPage() {
  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: txData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'inventory',
      { search: debouncedSearch, sorting, pageIndex, pageSize },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const sort = sorting[0];
      if (sort) {
        params.set('sortBy', sort.id);
        params.set('sortOrder', sort.desc ? 'desc' : 'asc');
      }
      return api.get<PaginatedResponse<InventoryTransaction>>(
        `/inventory/transactions?${params}`,
      );
    },
  });

  const { data: materials } = useQuery({
    queryKey: ['materials-all'],
    queryFn: () =>
      api.get<PaginatedResponse<Material>>('/materials?pageSize=100'),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () =>
      api.get<PaginatedResponse<Project>>('/projects?pageSize=100'),
  });

  const table = useReactTable({
    data: txData?.data ?? [],
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: txData?.meta.totalPages ?? -1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowStockIn(!showStockIn);
              setShowStockOut(false);
            }}
          >
            Stock In
          </Button>
          <Button
            onClick={() => {
              setShowStockOut(!showStockOut);
              setShowStockIn(false);
            }}
          >
            Stock Out
          </Button>
        </div>
      </div>

      {showStockIn && (
        <StockInForm
          materials={materials?.data ?? []}
          onClose={() => setShowStockIn(false)}
        />
      )}
      {showStockOut && (
        <StockOutForm
          materials={materials?.data ?? []}
          projects={projects?.data ?? []}
          onClose={() => setShowStockOut(false)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Transactions</CardTitle>
            <Input
              placeholder="Search by reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            table={table}
            columnCount={columns.length}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message ?? 'Failed to load transactions.'}
            emptyMessage="No transactions found."
          />
          <TablePagination
            pageIndex={pageIndex}
            totalPages={txData?.meta.totalPages ?? 1}
            total={txData?.meta.total}
            onPrevious={() => table.previousPage()}
            onNext={() => table.nextPage()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StockInForm({
  materials,
  onClose,
}: {
  materials: Material[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockInValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const mutation = useMutation({
    mutationFn: (data: StockInValues) => {
      const payload = { ...data, reference: data.reference || undefined };
      return api.post('/inventory/stock-in', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock In</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="grid gap-3 md:grid-cols-4"
        >
          <div className="space-y-1">
            <Label htmlFor="materialId">Material</Label>
            <Select id="materialId" {...register('materialId')}>
              <option value="">Select material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </Select>
            {errors.materialId && (
              <p className="text-xs text-destructive">
                {errors.materialId.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              placeholder="PO-2026-0001"
              {...register('reference')}
            />
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive md:col-span-4">
              {mutation.error?.message}
            </p>
          )}
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording...' : 'Record Stock In'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StockOutForm({
  materials,
  projects,
  onClose,
}: {
  materials: Material[];
  projects: Project[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockOutValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const mutation = useMutation({
    mutationFn: (data: StockOutValues) => {
      const payload = { ...data, reference: data.reference || undefined };
      return api.post('/inventory/stock-out', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Out</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="grid gap-3 md:grid-cols-5"
        >
          <div className="space-y-1">
            <Label htmlFor="materialId">Material</Label>
            <Select id="materialId" {...register('materialId')}>
              <option value="">Select material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code}) — {m.currentStock} {m.unit}
                </option>
              ))}
            </Select>
            {errors.materialId && (
              <p className="text-xs text-destructive">
                {errors.materialId.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectId">Project</Label>
            <Select id="projectId" {...register('projectId')}>
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </Select>
            {errors.projectId && (
              <p className="text-xs text-destructive">
                {errors.projectId.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              placeholder="ISS-2026-0001"
              {...register('reference')}
            />
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive md:col-span-5">
              {mutation.error?.message}
            </p>
          )}
          <div className="flex gap-2 md:col-span-5">
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording...' : 'Record Stock Out'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
