import { PageContainer } from "@/components/layout/PageContainer";
import { ComingSoon } from "@/components/common/ComingSoon";

export default function InventoryPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Inventory</h1>
      <ComingSoon module="Inventory" />
    </PageContainer>
  );
}
