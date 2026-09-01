'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/project-form';
import { api } from '@/lib/api';
import type { Project } from '@/lib/types';

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (isError || !project) {
    return (
      <div className="text-destructive">
        {error?.message ?? 'Project not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm project={project} />
    </div>
  );
}
