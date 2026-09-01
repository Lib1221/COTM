'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/use-debounce';
import type { Project, PaginatedResponse, ProjectStatus } from '@/lib/types';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, TablePagination } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const columnHelper = createColumnHelper<Project>();

const columns = [
  columnHelper.accessor('code', {
    header: 'Code',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('clientName', {
    header: 'Client',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('budget', {
    header: 'Budget',
    cell: (info) => formatCurrency(Number(info.getValue())),
  }),
  columnHelper.accessor('latestProgress', {
    header: 'Progress',
    enableSorting: false,
    cell: (info) => `${info.getValue() ?? 0}%`,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue() as ProjectStatus} />,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: (info) => (
      <Link
        href={`/projects/${info.row.original.id}`}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        View
      </Link>
    ),
  }),
];

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'projects',
      { search: debouncedSearch, sorting, pageIndex, pageSize },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
        sortBy: sorting[0]?.id ?? 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return api.get<PaginatedResponse<Project>>(`/projects?${params}`);
    },
  });

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
      <PageHeader title="Projects" description="Create and manage construction projects.">
        <Link
          href="/projects/new"
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          New Project
        </Link>
      </PageHeader>

      <Input
        placeholder="Search by name, code, or client..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message ?? 'Failed to load projects.'}
        emptyMessage="No projects found."
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
