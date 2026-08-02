import { PageContainer } from "@/components/layout/PageContainer";
import { LowStockList } from "./LowStockList";

export default function LowStockPage() {
  return (
    <PageContainer>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Low stock</h1>
      <p className="mb-4 text-sm text-slate-500">
        Medicines at or below their alert threshold.
      </p>
      <LowStockList />
    </PageContainer>
  );
}