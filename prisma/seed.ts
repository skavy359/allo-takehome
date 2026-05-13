import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouse1 = await prisma.warehouse.create({
    data: { name: "Main Warehouse", location: "New York" },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: { name: "West Coast Hub", location: "Los Angeles" },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: { name: "Wireless Headphones", description: "Bluetooth over-ear headphones", price: 100 },
    }),
    prisma.product.create({
      data: { name: "Mechanical Keyboard", description: "RGB mechanical keyboard", price: 200 },
    }),
    prisma.product.create({
      data: { name: "USB-C Hub", description: "7-in-1 USB-C adapter", price: 150 },
    }),
    prisma.product.create({
      data: { name: "Webcam HD", description: "1080p webcam with microphone", price: 300 },
    }),
    prisma.product.create({
      data: { name: "Mouse Pad XL", description: "Extended gaming mouse pad", price: 50 },
    }),
  ]);

  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse1.id,
        quantity: 5,
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse2.id,
        quantity: 10,
      },
    });
  }

  console.log("Seeded 2 warehouses, 5 products, and 10 inventory records");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    prisma.$disconnect();
  });
