'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BoqItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const boqSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  unit: z.string().min(1, 'Unit is required').max(20),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or greater'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
});

type BoqFormValues = z.infer<typeof boqSchema>;

export function BoqForm({
  projectId,
  item,
  onSuccess,
}: {
  projectId: string;
  item?: BoqItem;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BoqFormValues>({
    resolver: zodResolver(boqSchema),
    defaultValues: item
      ? {
          description: item.description,
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }
      : { quantity: 0, unitPrice: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: BoqFormValues) => {
      if (item) {
        return api.patch<BoqItem>(
          `/projects/${projectId}/boq/${item.id}`,
          data,
        );
      }
      return api.post<BoqItem>(`/projects/${projectId}/boq`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      {mutation.isError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {mutation.error?.message ?? 'An error occurred'}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" placeholder="m³, kg, m²..." {...register('unit')} />
          {errors.unit && (
            <p className="text-xs text-destructive">{errors.unit.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            {...register('quantity')}
          />
          {errors.quantity && (
            <p className="text-xs text-destructive">
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            {...register('unitPrice')}
          />
          {errors.unitPrice && (
            <p className="text-xs text-destructive">
              {errors.unitPrice.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}
