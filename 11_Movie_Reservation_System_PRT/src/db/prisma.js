const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 1. Set up the raw Postgres connection pool
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

// 2. Wrap it in Prisma's adapter
const adapter = new PrismaPg(pool);

// 3. Hand the adapter to the Prisma Client constructor!
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = prisma;