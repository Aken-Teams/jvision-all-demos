import { AdminDashboard } from "../../components/admin-dashboard";
import { getManagedProducts } from "../../lib/products-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminDashboard initialProducts={await getManagedProducts()} />;
}
