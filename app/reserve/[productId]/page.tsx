"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalStock: number;
  availableStock: number;
};

type Reservation = {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
};

export default function ReservePage() {
  const { productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((rs) => rs.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === productId);
        setProduct(found || null);
      });
  }, [productId]);

  useEffect(() => {
    if (!reservation || reservation.status !== "pending") return;

    const interval = setInterval(() => {
      const diff = new Date(reservation.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setError("Reservation expired");
        setReservation(null);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  async function handleReserve() {
    setError("");
    const rs = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });

    if (rs.status === 409) {
      setError("Not enough stock available (409 Conflict)");
      return;
    }

    if (!rs.ok) {
      setError("Something went wrong");
      return;
    }

    const data = await rs.json();
    setReservation(data);
  }

  async function handleAction(action: "confirm" | "cancel") {
    if (!reservation) return;
    setError("");

    const rs = await fetch(`/api/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (rs.status === 410) {
      setError("Reservation has expired (410 Gone)");
      setReservation(null);
      return;
    }

    if (!rs.ok) {
      setError("Something went wrong");
      return;
    }

    setReservation(null);
    setDone(action === "confirm" ? "Reservation confirmed!" : "Reservation cancelled.");
  }

  if (!product) return <p className="p-8">Loading...</p>;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <button onClick={() => router.push("/")} className="text-blue-600 mb-4">
        ← Back to products
      </button>

      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-500">{product.description}</p>
      <p className="mt-1 font-medium">Rs {product.price}</p>
      <p className="text-sm text-gray-600">Available: {product.availableStock}</p>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {done && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">{done}</div>
      )}

      {!reservation && !done && (
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={product.availableStock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border rounded px-3 py-2 w-24"
          />
          <button
            onClick={handleReserve}
            disabled={quantity < 1 || quantity > product.availableStock}
            className="ml-3 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
          >
            Reserve
          </button>
        </div>
      )}

      {reservation && (
        <div className="mt-6 border rounded p-4">
          <p className="font-medium">Reservation active</p>
          <p className="text-sm text-gray-600">Quantity: {reservation.quantity}</p>
          {timeLeft !== null && (
            <p className="text-sm mt-1">
              Expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleAction("confirm")}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Confirm
            </button>
            <button
              onClick={() => handleAction("cancel")}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
