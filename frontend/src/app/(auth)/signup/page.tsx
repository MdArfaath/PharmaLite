"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { signupSchema, type SignupInput } from "@/features/auth/schema";
import { signUp } from "@/features/auth/authActions";
import { ROUTES } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { shopName: "", fullName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupInput) {
    setSubmitting(true);
    const { error, needsConfirmation } = await signUp(values);
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (needsConfirmation) {
      setConfirmSent(true);
      return;
    }

    toast.success("Shop created");
    router.replace(ROUTES.dashboard);
    router.refresh();
  }

  if (confirmSent) {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <MailCheck className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a confirmation link. Open it, then sign in — your shop will be
          set up automatically.
        </p>
        <div className="mt-6">
          <Link href={ROUTES.login}>
            <Button variant="secondary" fullWidth>
              Go to sign in
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-900">Create your shop</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set up your pharmacy in a few seconds.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Shop name" error={errors.shopName?.message} required>
          <Input
            placeholder="City Medical Store"
            autoComplete="organization"
            invalid={!!errors.shopName}
            {...register("shopName")}
          />
        </Field>

        <Field label="Your name" error={errors.fullName?.message}>
          <Input
            placeholder="Optional"
            autoComplete="name"
            invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>

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

        <Field
          label="Password"
          error={errors.password?.message}
          hint="At least 6 characters"
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" fullWidth loading={submitting}>
          Create shop
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
