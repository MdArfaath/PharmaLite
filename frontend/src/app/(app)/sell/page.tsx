import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function SellPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Sell</h1>
      <ComingSoon module="Sell" />
    </PageContainer>
  );
}
