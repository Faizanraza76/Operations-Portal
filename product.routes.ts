import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./prismaClient";

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Password123!", 10);

  const users = await Promise.all(
    [
      { name: "Admin User", email: "admin@erp.test", role: "ADMIN" as const },
      { name: "Sales User", email: "sales@erp.test", role: "SALES" as const },
      { name: "Warehouse User", email: "warehouse@erp.test", role: "WAREHOUSE" as const },
      { name: "Accounts User", email: "accounts@erp.test", role: "ACCOUNTS" as const },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: password },
      })
    )
  );

  console.log(
    "Created users:",
    users.map((u) => `${u.email} (${u.role})`)
  );

  const products = await Promise.all(
    [
      { name: "Steel Pipe 2-inch", sku: "SP-2IN", category: "Pipes", unitPrice: 450, currentStock: 200, minStock: 20, location: "Warehouse A" },
      { name: "Copper Wire 10m Roll", sku: "CW-10M", category: "Electrical", unitPrice: 620, currentStock: 80, minStock: 15, location: "Warehouse A" },
      { name: "PVC Fitting Elbow", sku: "PVC-ELB", category: "Fittings", unitPrice: 35, currentStock: 500, minStock: 50, location: "Warehouse B" },
    ].map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: p,
      })
    )
  );

  console.log("Created products:", products.map((p) => p.sku));

  const salesUser = users.find((u) => u.role === "SALES")!;

  const existingCustomer = await prisma.customer.findFirst({ where: { mobile: "9999900001" } });
  const customer =
    existingCustomer ||
    (await prisma.customer.create({
      data: {
        name: "Ramesh Traders",
        mobile: "9999900001",
        email: "ramesh@traders.test",
        businessName: "Ramesh Traders Pvt Ltd",
        customerType: "WHOLESALE",
        address: "MG Road, Patna",
        status: "ACTIVE",
        createdById: salesUser.id,
      },
    }));

  console.log("Created customer:", customer.name);
  console.log("\nSeed complete. Test login credentials (password for all: Password123!):");
  users.forEach((u) => console.log(`  ${u.email} / ${u.role}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
