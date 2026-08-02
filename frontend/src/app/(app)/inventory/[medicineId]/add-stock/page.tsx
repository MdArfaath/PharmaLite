import { PageContainer } from "@/components/layout/PageContainer";
import { AddStock } from "./AddStock";

export default function AddStockPage({
  params,
}: {
  params: { medicineId: string };
}) {
  return (
    <PageContainer>
      <AddStock medicineId={params.medicineId} />
    </PageContainer>
  );
}
