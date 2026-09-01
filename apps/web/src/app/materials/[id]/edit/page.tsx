'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialForm } from '@/components/material-form';
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

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (isError || !material) {
    return (
      <div className="text-destructive">
        {error?.message ?? 'Material not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Material</h1>
      <MaterialForm material={material} />
    </div>
  );
}
