import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function LowStockPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Low stock</h1>
      <ComingSoon module="Low-stock alerts" />
    </PageContainer>
  );
}
