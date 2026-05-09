import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number.parseInt(process.env.PORT ?? "4000", 10),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  BINANCE_BASE_URL: (
    process.env.BINANCE_BASE_URL ?? "https://api.binance.com"
  ).replace(/\/$/, ""),
};
