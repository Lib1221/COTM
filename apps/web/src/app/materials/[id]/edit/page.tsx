import { MaterialForm } from '@/components/material-form';
import { api } from '@/lib/api';
import type { Material } from '@/lib/types';

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await api.get<Material>(`/materials/${id}`);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Material</h1>
      <MaterialForm material={material} />
    </div>
  );
}
