'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HardHat } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between">
        <div className="hazard-stripe" aria-hidden />
        <div className="site-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Liben CMS</p>
              <p className="font-mono text-xs text-muted-foreground">
                Construction yard desk
              </p>
            </div>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Keep the site moving.
            </h1>
            <p className="text-base text-muted-foreground">
              Projects, bills of quantities, materials, and progress — one
              control room for the yard.
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Signed access only · audit logged
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="hazard-stripe mb-4 rounded-sm" />
            <p className="text-lg font-bold">Liben CMS</p>
            <p className="text-sm text-muted-foreground">
              Sign in to the yard desk
            </p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the credentials issued by your site administrator.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@cms.test"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Contact an administrator to create an account.
          </p>
        </div>
      </section>
    </div>
  );
}
