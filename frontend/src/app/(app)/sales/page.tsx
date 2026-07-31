import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function SalesPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Sales history</h1>
      <ComingSoon module="Sales history" />
    </PageContainer>
  );
}
