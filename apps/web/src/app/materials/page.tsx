"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { api } from "@/lib/api";
import type { Material, PaginatedResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["materials", { search, sorting, pageIndex, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      return api.get<PaginatedResponse<Material>>(`/materials?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const columnHelper = createColumnHelper<Material>();

  const table = useReactTable({
    data: data?.data ?? [],
    columns: [
      columnHelper.accessor("code", { header: "Code", cell: (i) => i.getValue() }),
      columnHelper.accessor("name", { header: "Name", cell: (i) => i.getValue() }),
      columnHelper.accessor("unit", { header: "Unit", cell: (i) => i.getValue() }),
      columnHelper.accessor("currentStock", {
        header: "Current Stock",
        cell: (i) => i.getValue(),
      }),
      columnHelper.accessor("minimumStock", {
        header: "Min Stock",
        cell: (i) => i.getValue(),
      }),
      columnHelper.accessor("isLowStock", {
        header: "Status",
        cell: (i) =>
          i.getValue() ? <Badge variant="warning">Low Stock</Badge> : <Badge variant="success">In Stock</Badge>,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (i) => (
          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(i.row.original.id)}>
            Delete
          </Button>
        ),
      }),
    ],
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages ?? -1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materials</h1>
        <Link href="/materials/new">
          <Button>New Material</Button>
        </Link>
      </div>

      <Input
        placeholder="Search by name or code..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer p-3 text-left font-medium text-muted-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No materials found.</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={pageIndex === 0}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {data?.meta.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={pageIndex >= (data?.meta.totalPages ?? 1) - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
