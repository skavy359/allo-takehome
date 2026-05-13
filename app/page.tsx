"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalStock: number;
  availableStock: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then((rs) => rs.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8">Loading products...</p>;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded p-4">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-500 text-sm">{product.description}</p>
            <p className="mt-2 font-medium">Rs {product.price}</p>
            <p className="text-sm text-gray-600">
              Available: {product.availableStock} / {product.totalStock}
            </p>

            <button
              onClick={() => router.push(`/reserve/${product.id}`)}
              disabled={product.availableStock === 0}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {product.availableStock > 0 ? "Reserve" : "Out of Stock"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
