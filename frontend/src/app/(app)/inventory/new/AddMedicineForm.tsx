"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MedicineForm } from "@/components/inventory/MedicineForm";
import {
  useCreateMedicine,
  DuplicateNameError,
} from "@/features/inventory/queries";
import type { MedicineFormValues } from "@/features/inventory/schema";
import { ROUTES } from "@/lib/constants";

export function AddMedicineForm({ shopId }: { shopId: string }) {
  const router = useRouter();
  const create = useCreateMedicine(shopId);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: MedicineFormValues) {
    setSubmitting(true);
    try {
      await create.mutateAsync(values);
      toast.success("Medicine added");
      router.replace(ROUTES.inventory);
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof DuplicateNameError) {
        toast.error(err.message);
      } else {
        toast.error("Couldn't add medicine. Please try again.");
      }
    }
  }

  return (
    <MedicineForm
      submitLabel="Add medicine"
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}
