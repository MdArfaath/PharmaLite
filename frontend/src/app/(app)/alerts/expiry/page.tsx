import { PageContainer } from "@/components/layout/PageContainer";
import { ExpiryList } from "./ExpiryList";

export default function ExpiryPage() {
  return (
    <PageContainer>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Expiring soon</h1>
      <p className="mb-4 text-sm text-slate-500">
        Expired medicines and those nearing expiry.
      </p>
      <ExpiryList />
    </PageContainer>
  );
}
