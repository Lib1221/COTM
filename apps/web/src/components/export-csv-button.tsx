'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/export-csv';

export function ExportCsvButton({
  filename,
  rows,
  disabled,
}: {
  filename: string;
  rows: Record<string, unknown>[];
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || rows.length === 0}
      onClick={() => downloadCsv(filename, rows)}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
