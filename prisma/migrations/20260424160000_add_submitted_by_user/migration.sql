-- AlterTable
ALTER TABLE "supervisions" ADD COLUMN     "submittedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "supervisions_submittedByUserId_idx" ON "supervisions"("submittedByUserId");

-- AddForeignKey
ALTER TABLE "supervisions" ADD CONSTRAINT "supervisions_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
