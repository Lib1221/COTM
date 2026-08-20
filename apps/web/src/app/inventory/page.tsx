'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default function InventoryPage() {
  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);

  const { data: txData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () =>
      api.get<PaginatedResponse<InventoryTransaction>>(
        '/inventory/transactions?pageSize=20',
      ),
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
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : txData && txData.data.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Material</th>
                  <th className="p-3 font-medium">Project</th>
                  <th className="p-3 font-medium">Quantity</th>
                  <th className="p-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {txData.data.map((tx) => (
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
                    <td className="p-3">{tx.project?.name ?? '-'}</td>
                    <td className="p-3">
                      {tx.quantity} {tx.material?.unit}
                    </td>
                    <td className="p-3">{tx.reference ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          )}
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
  const mutation = useMutation({
    mutationFn: (data: {
      materialId: string;
      quantity: number;
      date: string;
      reference?: string;
    }) => api.post('/inventory/stock-in', data),
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
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate({
              materialId: fd.get('materialId') as string,
              quantity: Number(fd.get('quantity')),
              date: fd.get('date') as string,
              reference: (fd.get('reference') as string) || undefined,
            });
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <div className="space-y-1">
            <Label htmlFor="materialId">Material</Label>
            <select
              id="materialId"
              name="materialId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.001"
              min="0.001"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="PO-2026-0001" />
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
  const mutation = useMutation({
    mutationFn: (data: {
      materialId: string;
      projectId: string;
      quantity: number;
      date: string;
      reference?: string;
    }) => api.post('/inventory/stock-out', data),
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
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate({
              materialId: fd.get('materialId') as string,
              projectId: fd.get('projectId') as string,
              quantity: Number(fd.get('quantity')),
              date: fd.get('date') as string,
              reference: (fd.get('reference') as string) || undefined,
            });
          }}
          className="grid gap-3 md:grid-cols-5"
        >
          <div className="space-y-1">
            <Label htmlFor="materialId">Material</Label>
            <select
              id="materialId"
              name="materialId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code}) — {m.currentStock} {m.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectId">Project</Label>
            <select
              id="projectId"
              name="projectId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.001"
              min="0.001"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="ISS-2026-0001"
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
