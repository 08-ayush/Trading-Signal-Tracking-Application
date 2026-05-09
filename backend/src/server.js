import { env } from "./config/env.js";
import app from "./app.js";
import { prisma } from "./config/database.js";

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (code) => {
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(code));
    });
  };

  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));
}

start();
