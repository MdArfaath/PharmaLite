import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardContent } from "./DashboardContent";

export default function DashboardPage() {
  return (
    <PageContainer>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Overview</h1>
      <DashboardContent />
    </PageContainer>
  );
}
