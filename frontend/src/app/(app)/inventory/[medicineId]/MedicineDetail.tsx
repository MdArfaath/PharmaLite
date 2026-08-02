"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Archive } from "lucide-react";
import { toast } from "sonner";
import { MedicineForm } from "@/components/inventory/MedicineForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoadingState, ErrorState } from "@/components/common/States";
import {
  useMedicine,
  useUpdateMedicine,
  useArchiveMedicine,
  DuplicateNameError,
} from "@/features/inventory/queries";
import type { MedicineFormValues } from "@/features/inventory/schema";
import { ROUTES } from "@/lib/constants";

export function MedicineDetail({ medicineId }: { medicineId: string }) {
  const router = useRouter();
  const { data: medicine, isLoading, isError, refetch } =
    useMedicine(medicineId);
  const update = useUpdateMedicine(medicineId);
  const archive = useArchiveMedicine();

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleUpdate(values: MedicineFormValues) {
    setSubmitting(true);
    try {
      await update.mutateAsync(values);
      toast.success("Changes saved");
      router.replace(ROUTES.inventory);
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof DuplicateNameError) {
        toast.error(err.message);
      } else {
        toast.error("Couldn't save changes. Please try again.");
      }
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync(medicineId);
      setConfirmOpen(false);
      toast.success("Medicine archived");
      router.replace(ROUTES.inventory);
      router.refresh();
    } catch {
      toast.error("Couldn't archive. Please try again.");
    }
  }

  return (
    <div>
      <Link
        href={ROUTES.inventory}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Inventory
      </Link>

      {isLoading ? (
        <LoadingState label="Loading medicine…" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load medicine"
          onRetry={() => refetch()}
        />
      ) : !medicine ? (
        <ErrorState
          title="Medicine not found"
          description="It may have been archived, or it doesn't belong to your shop."
        />
      ) : (
        <>
          <h1 className="mb-4 text-lg font-semibold text-slate-900">
            {medicine.name}
          </h1>

          <MedicineForm
            initial={medicine}
            submitLabel="Save changes"
            submitting={submitting}
            onSubmit={handleUpdate}
          />

          <div className="mt-6 border-t border-slate-100 pt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setConfirmOpen(true)}
              className="text-danger"
            >
              <Archive className="h-4 w-4" />
              Archive medicine
            </Button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Archiving hides it from your inventory but keeps sales history.
            </p>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title={`Archive "${medicine.name}"?`}
            description="It will be removed from your inventory list. Past sales that reference it stay intact."
            confirmLabel="Archive"
            destructive
            loading={archive.isPending}
            onConfirm={handleArchive}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
}
