import { ProjectForm } from '@/components/project-form';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Project"
        description="Create a new construction project."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
