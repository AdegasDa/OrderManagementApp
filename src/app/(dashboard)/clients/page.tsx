import { Suspense } from "react";
import { getClients } from "@/features/clients/actions";
import { ClientList } from "@/features/clients/components/ClientList";
import { PaginationControls } from "@/components/ui/pagination-controls";

type SearchParams = Promise<{ page?: string }>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);
  const { items, total } = await getClients(page);
  return (
    <div className="px-4 py-4 md:p-6 space-y-4">
      <ClientList clients={items} />
      <Suspense>
        <PaginationControls page={page} total={total} pageSize={50} />
      </Suspense>
    </div>
  );
}
