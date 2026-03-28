import "dotenv/config";
import { defineConfig } from "@prisma/config"; // Note the @ symbol

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});