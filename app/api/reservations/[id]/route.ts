import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (action !== "confirm" && action !== "cancel") {
    return NextResponse.json({ error: "action must be confirm or cancel" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.status !== "pending") {
    return NextResponse.json({ error: "Reservation is already " + reservation.status }, { status: 400 });
  }

  if (new Date() > reservation.expiresAt) {
    await prisma.reservation.update({
      where: { id },
      data: { status: "released" },
    });
    return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
  }

  if (action === "cancel") {
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: "released" },
    });
    return NextResponse.json(updated);
  }

  const confirmed = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({
      where: { id: reservation.inventoryId },
    });

    if (!inv || inv.quantity < reservation.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    await tx.inventory.update({
      where: { id: inv.id },
      data: { quantity: inv.quantity - reservation.quantity },
    });

    return tx.reservation.update({
      where: { id },
      data: { status: "confirmed" },
    });
  });

  return NextResponse.json(confirmed);
}
