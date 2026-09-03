'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialForm } from '@/components/material-form';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { Material } from '@/lib/types';

export default function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: material,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['material', id],
    queryFn: () => api.get<Material>(`/materials/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isError || !material) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        {error?.message ?? 'Material not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Material"
        description={`Editing "${material.name}"`}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Material details</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialForm material={material} />
        </CardContent>
      </Card>
    </div>
  );
}
