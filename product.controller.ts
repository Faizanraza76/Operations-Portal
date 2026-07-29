generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  SALES
  WAREHOUSE
  ACCOUNTS
}

enum CustomerType {
  RETAIL
  WHOLESALE
  DISTRIBUTOR
}

enum CustomerStatus {
  LEAD
  ACTIVE
  INACTIVE
}

enum MovementType {
  IN
  OUT
}

enum ChallanStatus {
  DRAFT
  CONFIRMED
  CANCELLED
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role
  createdAt    DateTime @default(now())

  customersCreated   Customer[]       @relation("CustomerCreatedBy")
  followUps          FollowUp[]
  stockMovements     StockMovement[]
  challansCreated    Challan[]
}

model Customer {
  id           String         @id @default(uuid())
  name         String
  mobile       String
  email        String?
  businessName String?
  gstNumber    String?
  customerType CustomerType
  address      String?
  status       CustomerStatus @default(LEAD)
  followUpDate DateTime?
  notes        String?
  createdById  String?
  createdBy    User?          @relation("CustomerCreatedBy", fields: [createdById], references: [id])
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  followUps FollowUp[]
  challans  Challan[]

  @@index([name])
  @@index([mobile])
}

model FollowUp {
  id         String   @id @default(uuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  note       String
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt  DateTime @default(now())
}

model Product {
  id           String   @id @default(uuid())
  name         String
  sku          String   @unique
  category     String?
  unitPrice    Decimal  @db.Decimal(12, 2)
  currentStock Int      @default(0)
  minStock     Int      @default(0)
  location     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  stockMovements StockMovement[]
  challanItems   ChallanItem[]

  @@index([name])
  @@index([sku])
}

model StockMovement {
  id           String       @id @default(uuid())
  productId    String
  product      Product      @relation(fields: [productId], references: [id])
  quantity     Int
  movementType MovementType
  reason       String
  createdById  String?
  createdBy    User?        @relation(fields: [createdById], references: [id])
  createdAt    DateTime     @default(now())

  @@index([productId])
}

model Challan {
  id            String        @id @default(uuid())
  challanNumber String        @unique
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  totalQuantity Int           @default(0)
  status        ChallanStatus @default(DRAFT)
  createdById   String?
  createdBy     User?         @relation(fields: [createdById], references: [id])
  createdAt     DateTime      @default(now())
  confirmedAt   DateTime?
  cancelledAt   DateTime?

  items ChallanItem[]

  @@index([customerId])
  @@index([status])
}

model ChallanItem {
  id        String  @id @default(uuid())
  challanId String
  challan   Challan @relation(fields: [challanId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])

  // Snapshot of product at time of challan creation (per spec: don't rely only on productId)
  productNameSnapshot String
  productSkuSnapshot  String
  unitPriceSnapshot   Decimal @db.Decimal(12, 2)

  quantity Int

  @@index([challanId])
  @@index([productId])
}
