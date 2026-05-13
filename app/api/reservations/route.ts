import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, quantity } = body;

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "productId and quantity are required" }, { status: 400 });
  }

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const inventoryRows = await tx.inventory.findMany({
        where: { productId },
      });

      if (inventoryRows.length === 0) {
        throw new Error("NO_INVENTORY");
      }

      for (const inv of inventoryRows) {
        const pendingReservations = await tx.reservation.aggregate({
          where: { inventoryId: inv.id, status: "pending" },
          _sum: { quantity: true },
        });

        const reserved = pendingReservations._sum.quantity || 0;
        const available = inv.quantity - reserved;

        if (available >= quantity) {
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

          const newReservation = await tx.reservation.create({
            data: {
              inventoryId: inv.id,
              quantity,
              status: "pending",
              expiresAt,
            },
          });

          return newReservation;
        }
      }

      throw new Error("INSUFFICIENT_STOCK");
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "NO_INVENTORY" || message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Not enough stock available" }, { status: 409 });
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
