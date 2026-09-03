import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <div className="hazard-stripe mx-auto w-24 rounded-sm" />
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That route is not on the yard map.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Back to dashboard
      </Link>
    </div>
  );
}
