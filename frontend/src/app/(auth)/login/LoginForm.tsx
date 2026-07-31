"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { signIn, ensureProvisioned } from "@/features/auth/authActions";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const { error } = await signIn(values);

    if (error) {
      setSubmitting(false);
      toast.error(error);
      return;
    }

    // Cover the email-confirmation signup path: provision on first login.
    await ensureProvisioned();

    const redirectTo =
      searchParams.get("redirectedFrom") || ROUTES.dashboard;
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to manage your pharmacy.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message} required>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          href={ROUTES.signup}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Create your shop
        </Link>
      </p>
    </Card>
  );
}
