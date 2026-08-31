'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProgressRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const progressSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required').max(500),
  progressPercent: z.coerce
    .number()
    .int('Must be a whole number')
    .min(0, 'Minimum is 0')
    .max(100, 'Maximum is 100'),
  notes: z.string().max(2000).optional(),
});

type ProgressFormValues = z.infer<typeof progressSchema>;

export function ProgressForm({
  projectId,
  record,
  onSuccess,
}: {
  projectId: string;
  record?: ProgressRecord;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgressFormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues: record
      ? {
          date: record.date.split('T')[0],
          description: record.description,
          progressPercent: record.progressPercent,
          notes: record.notes ?? '',
        }
      : { date: new Date().toISOString().split('T')[0], progressPercent: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: ProgressFormValues) => {
      const payload = { ...data, notes: data.notes || undefined };
      if (record) {
        return api.patch<ProgressRecord>(
          `/projects/${projectId}/progress/${record.id}`,
          payload,
        );
      }
      return api.post<ProgressRecord>(`/projects/${projectId}/progress`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="progressPercent">Progress %</Label>
          <Input
            id="progressPercent"
            type="number"
            min="0"
            max="100"
            {...register('progressPercent')}
          />
          {errors.progressPercent && (
            <p className="text-xs text-destructive">
              {errors.progressPercent.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Saving...'
            : record
              ? 'Update Record'
              : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}
