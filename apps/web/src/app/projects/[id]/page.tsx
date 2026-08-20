"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProjectDetail, BoqItem, ProgressRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  if (id === null) {
    params.then((p) => setId(p.id));
    return <div className="text-muted-foreground">Loading...</div>;
  }
  return <ProjectDetail id={id} />;
}

function ProjectDetail({ id }: { id: string }) {
  const [showBoqForm, setShowBoqForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<ProjectDetail>(`/projects/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      window.location.href = "/projects";
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!project) return <div className="text-muted-foreground">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(`Delete project "${project.name}"?`)) deleteMutation.mutate();
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Code</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{project.code}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Client</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{project.clientName}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Location</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{project.location}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Budget</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{formatCurrency(project.budget)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">BOQ Value</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{formatCurrency(project.boqValue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Latest Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${project.latestProgress}%` }} />
              </div>
              <span className="text-sm font-semibold">{project.latestProgress}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BoqSection projectId={id} items={project.boqItems} showForm={showBoqForm} setShowForm={setShowBoqForm} />
      <ProgressSection projectId={id} records={project.progressRecords} showForm={showProgressForm} setShowForm={setShowProgressForm} />

      {project.inventoryTransactions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Inventory Transactions</CardTitle></CardHeader>
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
                      <Badge variant={tx.type === "STOCK_IN" ? "success" : "warning"}>
                        {tx.type === "STOCK_IN" ? "Stock In" : "Stock Out"}
                      </Badge>
                    </td>
                    <td className="p-3">{tx.material?.name ?? "-"}</td>
                    <td className="p-3">{tx.quantity}</td>
                    <td className="p-3">{tx.reference ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BoqSection({
  projectId,
  items,
  showForm,
  setShowForm,
}: {
  projectId: string;
  items: BoqItem[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { description: string; unit: string; quantity: number; unitPrice: number }) =>
      api.post(`/projects/${projectId}/boq`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/projects/${projectId}/boq/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>BOQ Items</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add BOQ Item"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate({
                description: fd.get("description") as string,
                unit: fd.get("unit") as string,
                quantity: Number(fd.get("quantity")),
                unitPrice: Number(fd.get("unitPrice")),
              });
            }}
            className="mb-4 grid gap-3 rounded-lg border p-4 md:grid-cols-4"
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending} className="md:col-span-4">
              {createMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
            {createMutation.isError && (
              <p className="text-xs text-destructive md:col-span-4">
                {createMutation.error?.message}
              </p>
            )}
          </form>
        )}

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
                  <td className="p-3">{formatCurrency(Number(item.unitPrice))}</td>
                  <td className="p-3 font-medium">{formatCurrency(Number(item.total))}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2">
              <tr className="font-semibold">
                <td className="p-3" colSpan={4}>Total BOQ Value</td>
                <td className="p-3">{formatCurrency(items.reduce((s, i) => s + Number(i.total), 0))}</td>
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
  showForm,
  setShowForm,
}: {
  projectId: string;
  records: ProgressRecord[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { date: string; description: string; progressPercent: number; notes?: string }) =>
      api.post(`/projects/${projectId}/progress`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => api.delete(`/projects/${projectId}/progress/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Records</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Progress"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate({
                date: fd.get("date") as string,
                description: fd.get("description") as string,
                progressPercent: Number(fd.get("progressPercent")),
                notes: (fd.get("notes") as string) || undefined,
              });
            }}
            className="mb-4 space-y-3 rounded-lg border p-4"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="progressPercent">Progress %</Label>
                <Input id="progressPercent" name="progressPercent" type="number" min="0" max="100" required />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Record"}
            </Button>
            {createMutation.isError && (
              <p className="text-xs text-destructive">{createMutation.error?.message}</p>
            )}
          </form>
        )}

        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No progress records yet.</p>
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
                    <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(r.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {r.notes && <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
