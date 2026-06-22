import { Suspense } from "react";
import { getProducts } from "@/features/products/actions";
import { ProductList } from "@/features/products/components/ProductList";
import { PaginationControls } from "@/components/ui/pagination-controls";

type SearchParams = Promise<{ page?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);
  const { items, total } = await getProducts(page);
  return (
    <div className="px-4 py-4 md:p-6 space-y-4">
      <ProductList products={items} />
      <Suspense>
        <PaginationControls page={page} total={total} pageSize={50} />
      </Suspense>
    </div>
  );
}
