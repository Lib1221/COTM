'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/project-form';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isError || !project) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        {error?.message ?? 'Project not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Project"
        description={`Editing "${project.name}"`}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
