import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentContext } from "@/features/auth/getCurrentContext";
import { ROUTES } from "@/lib/constants";
import { AddMedicineForm } from "./AddMedicineForm";

export default async function AddMedicinePage() {
  const { shop } = await getCurrentContext();
  // The (app) layout already guarantees a shop; guard for types.
  if (!shop) return null;

  return (
    <PageContainer>
      <Link
        href={ROUTES.inventory}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Inventory
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Add medicine</h1>
      <AddMedicineForm shopId={shop.id} />
    </PageContainer>
  );
}