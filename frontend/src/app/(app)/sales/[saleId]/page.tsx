import { PageContainer } from "@/components/layout/PageContainer";
import { SaleDetailScreen } from "./SaleDetailScreen";

export default function SaleDetailPage({
  params,
}: {
  params: { saleId: string };
}) {
  return (
    <PageContainer>
      <SaleDetailScreen saleId={params.saleId} />
    </PageContainer>
  );
}
