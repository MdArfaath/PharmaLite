import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function AddMedicinePage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Add medicine</h1>
      <ComingSoon module="Add medicine" />
    </PageContainer>
  );
}
