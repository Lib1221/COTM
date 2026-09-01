'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { api } from '@/lib/api';
import type { ProjectDetail, BoqItem, ProgressRecord } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BoqForm } from '@/components/boq-form';
import { ProgressForm } from '@/components/progress-form';
import { DataTable, TablePagination } from '@/components/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <ProjectDetail id={id} />;
}

function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [boqDialog, setBoqDialog] = React.useState<{
    open: boolean;
    item?: BoqItem;
  }>({ open: false });
  const [progressDialog, setProgressDialog] = React.useState<{
    open: boolean;
    record?: ProgressRecord;
  }>({ open: false });
  const [actionError, setActionError] = React.useState<string | null>(null);

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<ProjectDetail>(`/projects/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/projects');
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (isError) {
    return (
      <div className="text-destructive">
        {error?.message ?? 'Failed to load project.'}
      </div>
    );
  }
  if (!project)
    return <div className="text-muted-foreground">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Edit
          </Link>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm(`Delete project "${project.name}"?`))
                deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Code" value={project.code} />
        <InfoCard title="Client" value={project.clientName} />
        <InfoCard title="Location" value={project.location} />
        <InfoCard
          title="Budget"
          value={formatCurrency(Number(project.budget))}
        />
        <InfoCard
          title="BOQ Value"
          value={formatCurrency(Number(project.boqValue))}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Latest Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${project.latestProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {project.latestProgress}%
              </span>
            </div>
          </CardContent>
        </Card>
        <InfoCard title="Start Date" value={formatDate(project.startDate)} />
        <InfoCard
          title="End Date"
          value={project.endDate ? formatDate(project.endDate) : '—'}
        />
      </div>

      <BoqSection
        projectId={id}
        items={project.boqItems}
        onEdit={(item) => setBoqDialog({ open: true, item })}
        onAdd={() => setBoqDialog({ open: true })}
      />
      <ProgressSection
        projectId={id}
        records={project.progressRecords}
        onEdit={(record) => setProgressDialog({ open: true, record })}
        onAdd={() => setProgressDialog({ open: true })}
      />

      {project.inventoryTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Material</th>
                  <th className="p-3 font-medium">Quantity</th>
                  <th className="p-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {project.inventoryTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="p-3">{formatDate(tx.date)}</td>
                    <td className="p-3">
                      <Badge
                        variant={tx.type === 'STOCK_IN' ? 'success' : 'warning'}
                      >
                        {tx.type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}
                      </Badge>
                    </td>
                    <td className="p-3">{tx.material?.name ?? '-'}</td>
                    <td className="p-3">{tx.quantity}</td>
                    <td className="p-3">{tx.reference ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={boqDialog.open}
        onOpenChange={(open) => setBoqDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {boqDialog.item ? 'Edit BOQ Item' : 'Add BOQ Item'}
            </DialogTitle>
          </DialogHeader>
          <BoqForm
            projectId={id}
            item={boqDialog.item}
            onSuccess={() => setBoqDialog({ open: false })}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={progressDialog.open}
        onOpenChange={(open) => setProgressDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {progressDialog.record
                ? 'Edit Progress Record'
                : 'Add Progress Record'}
            </DialogTitle>
          </DialogHeader>
          <ProgressForm
            projectId={id}
            record={progressDialog.record}
            onSuccess={() => setProgressDialog({ open: false })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function BoqSection({
  projectId,
  items,
  onAdd,
  onEdit,
}: {
  projectId: string;
  items: BoqItem[];
  onAdd: () => void;
  onEdit: (item: BoqItem) => void;
}) {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/projects/${projectId}/boq/${itemId}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const columnHelper = createColumnHelper<BoqItem>();
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (i) => i.getValue(),
      }),
      columnHelper.accessor('unit', {
        header: 'Unit',
        cell: (i) => i.getValue(),
      }),
      columnHelper.accessor('quantity', {
        header: 'Qty',
        cell: (i) => Number(i.getValue()),
      }),
      columnHelper.accessor('unitPrice', {
        header: 'Unit Price',
        cell: (i) => formatCurrency(Number(i.getValue())),
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: (i) => (
          <span className="font-medium">
            {formatCurrency(Number(i.getValue()))}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: (i) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(i.row.original)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Delete this BOQ item?'))
                  deleteMutation.mutate(i.row.original.id);
              }}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ],
    [columnHelper, deleteMutation, onEdit],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalValue = items.reduce((s, i) => s + Number(i.total), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>BOQ Items</CardTitle>
          <Button size="sm" onClick={onAdd}>
            Add BOQ Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search BOQ items..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
        <DataTable
          table={table}
          columnCount={columns.length}
          emptyMessage="No BOQ items yet."
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            Total BOQ Value: {formatCurrency(totalValue)}
          </p>
          <TablePagination
            pageIndex={table.getState().pagination.pageIndex}
            totalPages={table.getPageCount() || 1}
            total={table.getFilteredRowModel().rows.length}
            onPrevious={() => table.previousPage()}
            onNext={() => table.nextPage()}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressSection({
  projectId,
  records,
  onAdd,
  onEdit,
}: {
  projectId: string;
  records: ProgressRecord[];
  onAdd: () => void;
  onEdit: (record: ProgressRecord) => void;
}) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) =>
      api.delete(`/projects/${projectId}/progress/${recordId}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Records</CardTitle>
          <Button size="sm" onClick={onAdd}>
            Add Progress
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {actionError && (
          <p className="mb-3 text-sm text-destructive">{actionError}</p>
        )}
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No progress records yet.
          </p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{r.progressPercent}%</Badge>
                    <span className="text-sm font-medium">{r.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.date)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm('Delete this progress record?'))
                          deleteMutation.mutate(r.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {r.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
