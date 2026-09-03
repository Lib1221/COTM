import { MaterialForm } from '@/components/material-form';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewMaterialPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Material"
        description="Add a new material to the catalog."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Material details</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialForm />
        </CardContent>
      </Card>
    </div>
  );
}
