-- CreateTable
CREATE TABLE "personal_expenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "personal_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personal_expenses_user_id_idx" ON "personal_expenses"("user_id");

-- CreateIndex
CREATE INDEX "personal_expenses_user_id_created_at_idx" ON "personal_expenses"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "personal_expenses" ADD CONSTRAINT "personal_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
