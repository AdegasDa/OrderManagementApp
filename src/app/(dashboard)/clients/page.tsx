import { getClients } from "@/features/clients/actions";
import { ClientList } from "@/features/clients/components/ClientList";

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="p-6">
      <ClientList clients={clients} />
    </div>
  );
}
