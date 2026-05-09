-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('OPEN', 'TARGET_HIT', 'STOPLOSS_HIT', 'EXPIRED');

-- CreateTable
CREATE TABLE "trading_signals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "symbol" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "entry_price" DECIMAL(20,8) NOT NULL,
    "stop_loss" DECIMAL(20,8) NOT NULL,
    "target_price" DECIMAL(20,8) NOT NULL,
    "entry_time" TIMESTAMP(3) NOT NULL,
    "expiry_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SignalStatus" NOT NULL DEFAULT 'OPEN',
    "realized_roi" DECIMAL(12,4),

    CONSTRAINT "trading_signals_pkey" PRIMARY KEY ("id")
);
