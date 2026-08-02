import { PageContainer } from "@/components/layout/PageContainer";
import { MedicineDetail } from "./MedicineDetail";

export default function MedicineDetailPage({
  params,
}: {
  params: { medicineId: string };
}) {
  return (
    <PageContainer>
      <MedicineDetail medicineId={params.medicineId} />
    </PageContainer>
  );
}
