import { PageContainer } from "@/components/layout/PageContainer";
import { SalesList } from "./SalesList";

export default function SalesPage() {
  return (
    <PageContainer>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Sales history</h1>
      <p className="mb-4 text-sm text-slate-500">
        All sales, most recent first.
      </p>
      <SalesList />
    </PageContainer>
  );
}
