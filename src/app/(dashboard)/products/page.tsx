import { getProducts } from "@/features/products/actions";
import { ProductList } from "@/features/products/components/ProductList";

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="p-6">
      <ProductList products={products} />
    </div>
  );
}
