import { PrismaClient } from '@prisma/client';

// Single Prisma client instance used across the backend
export const prisma = new PrismaClient();
