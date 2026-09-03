'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import { ScrollText } from 'lucide-react';
import { api } from '@/lib/api';
import type { AuditLogEntry, PaginatedResponse } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { DataTable, TablePagination } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Select } from '@/components/ui/select';

const ACTION_VARIANT: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
  LOGIN: 'secondary',
  REGISTER: 'default',
};

const columnHelper = createColumnHelper<AuditLogEntry>();

const columns = [
  columnHelper.accessor('createdAt', {
    header: 'Timestamp',
    cell: (i) => new Date(i.getValue()).toLocaleString(),
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: (i) => (
      <Badge variant={ACTION_VARIANT[i.getValue()] ?? 'secondary'}>
        {i.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('entity', {
    header: 'Entity',
    cell: (i) => <span className="font-medium">{i.getValue()}</span>,
  }),
  columnHelper.accessor('method', {
    header: 'Method',
    cell: (i) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
        {i.getValue()}
      </code>
    ),
  }),
  columnHelper.accessor('path', {
    header: 'Path',
    cell: (i) => (
      <span className="font-mono text-xs text-muted-foreground">
        {i.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (i) => (
      <span
        className={
          i.getValue() >= 400
            ? 'font-medium text-destructive'
            : 'text-muted-foreground'
        }
      >
        {i.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('ip', {
    header: 'IP',
    cell: (i) => i.getValue() ?? '-',
  }),
];

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState('');
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit', { entityFilter, pageIndex, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (entityFilter) params.set('entity', entityFilter);
      return api.get<PaginatedResponse<AuditLogEntry>>(`/audit?${params}`);
    },
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages ?? -1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Track all mutations made by users across the system."
      >
        <Select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-40"
        >
          <option value="">All entities</option>
          <option value="project">Project</option>
          <option value="material">Material</option>
          <option value="inventory">Inventory</option>
          <option value="auth">Auth</option>
          <option value="user">User</option>
        </Select>
      </PageHeader>

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message ?? 'Failed to load audit log.'}
        emptyMessage={
          <EmptyState
            icon={ScrollText}
            title="No audit entries"
            description="Mutation activity will appear here."
          />
        }
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
