"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/features/products/actions";
import { ProductList } from "@/features/products/components/ProductList";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { getProducts().then(setProducts); }, []);

  return (
    <div className="p-6">
      <ProductList products={products} />
    </div>
  );
}
