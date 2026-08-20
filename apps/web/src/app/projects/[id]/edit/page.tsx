import { ProjectForm } from "@/components/project-form";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await api.get<Project>(`/projects/${id}`);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm project={project} />
    </div>
  );
}
