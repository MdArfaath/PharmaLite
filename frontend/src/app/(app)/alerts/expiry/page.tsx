import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function ExpiryPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Expiring soon</h1>
      <ComingSoon module="Expiry alerts" />
    </PageContainer>
  );
}
