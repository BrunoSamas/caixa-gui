-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "paymentMethod" TEXT;

-- CreateIndex
CREATE INDEX "CustomerOrder_status_createdAt_idx" ON "CustomerOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderLine_customerOrderId_idx" ON "OrderLine"("customerOrderId");

-- CreateIndex
CREATE INDEX "OrderLine_productId_idx" ON "OrderLine"("productId");
