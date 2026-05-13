import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  await prisma.reservation.updateMany({
    where: { status: "pending", expiresAt: { lt: new Date() } },
    data: { status: "released" },
  });
  const products = await prisma.product.findMany({
    include: {
      inventory: {
        include: {
          reservations: {
            where: { status: "pending" },
          },
        },
      },
    },
  });

  const result = products.map((product: typeof products[number]) => {
    let totalStock = 0;
    let totalReserved = 0;

    for (const inv of product.inventory) {
      totalStock += inv.quantity;
      for (const res of inv.reservations) {
        totalReserved += res.quantity;
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      totalStock,
      availableStock: totalStock - totalReserved,
    };
  });

  return NextResponse.json(result);
}
