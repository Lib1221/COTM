'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProjectDetail, BoqItem, ProgressRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BoqForm } from '@/components/boq-form';
import { ProgressForm } from '@/components/progress-form';
import { formatCurrency, formatDate } from '@/lib/utils';

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

  const { data: project, isLoading } = useQuery({
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
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!project)
    return <div className="text-muted-foreground">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(`Delete project "${project.name}"?`))
                deleteMutation.mutate();
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.clientName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.location}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(project.budget)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              BOQ Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(project.boqValue)}
            </p>
          </CardContent>
        </Card>
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

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/projects/${projectId}/boq/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>BOQ Items</CardTitle>
          <Button size="sm" onClick={onAdd}>
            Add BOQ Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No BOQ items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Unit</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Unit Price</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="p-3 font-medium">
                    {formatCurrency(Number(item.total))}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this BOQ item?'))
                            deleteMutation.mutate(item.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2">
              <tr className="font-semibold">
                <td className="p-3" colSpan={4}>
                  Total BOQ Value
                </td>
                <td className="p-3">
                  {formatCurrency(
                    items.reduce((s, i) => s + Number(i.total), 0),
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
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

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) =>
      api.delete(`/projects/${projectId}/progress/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
                  <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
