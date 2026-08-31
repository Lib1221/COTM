'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Material } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().min(1, 'Code is required').max(50),
  unit: z.string().min(1, 'Unit is required').max(20),
  currentStock: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().min(0).optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export function MaterialForm({ material }: { material?: Material }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          name: material.name,
          code: material.code,
          unit: material.unit,
          currentStock: Number(material.currentStock),
          minimumStock: Number(material.minimumStock),
        }
      : { currentStock: 0, minimumStock: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: MaterialFormValues) => {
      if (material) {
        return api.patch<Material>(`/materials/${material.id}`, data);
      }
      return api.post<Material>('/materials', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/materials');
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-6 max-w-2xl"
    >
      {mutation.isError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {mutation.error?.message ?? 'An error occurred'}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Material Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register('code')} />
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" placeholder="bag, kg, m³..." {...register('unit')} />
          {errors.unit && (
            <p className="text-xs text-destructive">{errors.unit.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentStock">Current Stock</Label>
          <Input
            id="currentStock"
            type="number"
            step="0.001"
            {...register('currentStock')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumStock">Minimum Stock</Label>
          <Input
            id="minimumStock"
            type="number"
            step="0.001"
            {...register('minimumStock')}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Saving...'
            : material
              ? 'Update Material'
              : 'Create Material'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
