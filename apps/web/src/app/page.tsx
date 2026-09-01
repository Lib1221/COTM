'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FolderKanban,
  HardHat,
  CheckCircle2,
  Package,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import type { Dashboard } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'var(--chart-3)',
  ONGOING: 'var(--chart-1)',
  COMPLETED: 'var(--chart-2)',
};

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/dashboard'),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        {error?.message ?? 'Failed to load dashboard.'}
      </div>
    );
  }

  const statusData = [
    { name: 'Planned', value: data.projects.total - data.projects.ongoing - data.projects.completed, key: 'PLANNED' },
    { name: 'Ongoing', value: data.projects.ongoing, key: 'ONGOING' },
    { name: 'Completed', value: data.projects.completed, key: 'COMPLETED' },
  ].filter((d) => d.value > 0);

  const budgetData = data.projectPerformance.map((p) => ({
    name: p.code,
    Budget: Number(p.budget),
    BOQ: Number(p.boqValue),
  }));

  const kpis = [
    {
      label: 'Total Projects',
      value: data.projects.total,
      icon: FolderKanban,
      color: 'var(--chart-3)',
    },
    {
      label: 'Ongoing',
      value: data.projects.ongoing,
      icon: HardHat,
      color: 'var(--chart-1)',
    },
    {
      label: 'Completed',
      value: data.projects.completed,
      icon: CheckCircle2,
      color: 'var(--chart-2)',
    },
    {
      label: 'Materials',
      value: data.inventory.totalMaterials,
      icon: Package,
      color: 'var(--chart-5)',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of projects, inventory, and performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: kpi.color }} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget vs BOQ Value
            </CardTitle>
            <CardDescription>
              Comparison of project budgets against BOQ value
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No projects to display.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--popover-foreground)',
                    }}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Legend />
                  <Bar
                    dataKey="Budget"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="BOQ"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Distribution by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No projects yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={STATUS_COLORS[entry.key]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--popover-foreground)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low-Stock Alerts
            </CardTitle>
            <CardDescription>
              {data.inventory.lowStockCount} material
              {data.inventory.lowStockCount === 1 ? '' : 's'} below minimum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.inventory.lowStock.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                All materials are well stocked.
              </p>
            ) : (
              data.inventory.lowStock.map((m) => {
                const pct = Math.min(
                  100,
                  (Number(m.currentStock) / Math.max(Number(m.minimumStock), 1)) *
                    100,
                );
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.currentStock} / {m.minimumStock} {m.unit}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      indicatorClassName={cn(
                        pct < 50 ? 'bg-destructive' : 'bg-warning',
                      )}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>
              Budget, BOQ value, and progress for all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3 font-medium">Project</th>
                    <th className="p-3 font-medium">Budget</th>
                    <th className="p-3 font-medium">BOQ Value</th>
                    <th className="p-3 font-medium">Progress</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projectPerformance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-muted-foreground"
                      >
                        No projects yet.
                      </td>
                    </tr>
                  ) : (
                    data.projectPerformance.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="p-3">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="p-3">{formatCurrency(p.budget)}</td>
                        <td className="p-3">{formatCurrency(p.boqValue)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={p.progressPercent}
                              className="w-20"
                            />
                            <span className="text-xs font-medium">
                              {p.progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
