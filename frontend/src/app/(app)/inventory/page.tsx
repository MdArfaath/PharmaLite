import { PageContainer } from "@/components/layout/PageContainer";
import { InventoryList } from "./InventoryList";

export default function InventoryPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Inventory</h1>
      <InventoryList />
    </PageContainer>
  );
}
