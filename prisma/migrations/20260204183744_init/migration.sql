-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_guildId_userId_key" ON "Player"("guildId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_guildId_userId_eventKey_currency_key" ON "Balance"("guildId", "userId", "eventKey", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Item_guildId_userId_eventKey_key_key" ON "Item"("guildId", "userId", "eventKey", "key");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_guildId_userId_fkey" FOREIGN KEY ("guildId", "userId") REFERENCES "Player"("guildId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_guildId_userId_fkey" FOREIGN KEY ("guildId", "userId") REFERENCES "Player"("guildId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
