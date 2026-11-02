import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (JavaScript)...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // 2. Default password hash for all seed accounts: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Sample Users
  const rahul = await prisma.user.create({
    data: {
      email: 'rahul@abctech.com',
      fullName: 'Rahul Sharma',
      passwordHash,
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@abctech.com',
      fullName: 'Priya Patel',
      passwordHash,
    },
  });

  const arjun = await prisma.user.create({
    data: {
      email: 'arjun@abctech.com',
      fullName: 'Arjun Reddy',
      passwordHash,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      email: 'sneha@abctech.com',
      fullName: 'Sneha Rao',
      passwordHash,
    },
  });

  const vikram = await prisma.user.create({
    data: {
      email: 'vikram@abctech.com',
      fullName: 'Vikram Das',
      passwordHash,
    },
  });

  console.log('👤 Created 5 sample users with hashed passwords.');

  // 4. Create Parent Organization: ABC Technologies
  const abcTech = await prisma.organization.create({
    data: {
      name: 'ABC Technologies',
    },
  });

  console.log(`🏢 Created Organization: ${abcTech.name}`);

  // 5. Create 3 Tenants (Branches)
  const hyderabad = await prisma.tenant.create({
    data: {
      name: 'Hyderabad Branch',
      organizationId: abcTech.id,
    },
  });

  const bangalore = await prisma.tenant.create({
    data: {
      name: 'Bangalore Branch',
      organizationId: abcTech.id,
    },
  });

  const chennai = await prisma.tenant.create({
    data: {
      name: 'Chennai Branch',
      organizationId: abcTech.id,
    },
  });

  console.log('📍 Created 3 Tenants: Hyderabad, Bangalore, Chennai.');

  // 6. Assign Memberships with RBAC Roles
  // Rahul: Organization Admin (Org-wide access and Hyderabad)
  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: abcTech.id,
      tenantId: null, // Org-level administrator
      role: 'ORG_ADMIN',
    },
  });

  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: abcTech.id,
      tenantId: hyderabad.id,
      role: 'ORG_ADMIN',
    },
  });

  // Priya: Tenant Admin for Hyderabad Branch
  await prisma.membership.create({
    data: {
      userId: priya.id,
      organizationId: abcTech.id,
      tenantId: hyderabad.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Arjun: Member in Hyderabad Branch
  await prisma.membership.create({
    data: {
      userId: arjun.id,
      organizationId: abcTech.id,
      tenantId: hyderabad.id,
      role: 'MEMBER',
    },
  });

  // Sneha: Tenant Admin for Bangalore Branch
  await prisma.membership.create({
    data: {
      userId: sneha.id,
      organizationId: abcTech.id,
      tenantId: bangalore.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Vikram: Member in Chennai Branch
  await prisma.membership.create({
    data: {
      userId: vikram.id,
      organizationId: abcTech.id,
      tenantId: chennai.id,
      role: 'MEMBER',
    },
  });

  console.log('🛡️ Assigned memberships with RBAC roles (Org Admin, Tenant Admin, Member).');

  // 7. Create Board & Columns for Hyderabad Branch
  const hydBoard = await prisma.board.create({
    data: {
      name: 'Product Engineering Kanban',
      description: 'Sprint workspace for Hyderabad engineering team',
      organizationId: abcTech.id,
      tenantId: hyderabad.id,
      createdById: priya.id,
    },
  });

  // Kanban Columns (To Do, In Progress, Testing, Done)
  const colTodo = await prisma.column.create({
    data: {
      name: 'To Do',
      position: 1000,
      boardId: hydBoard.id,
      tenantId: hyderabad.id,
    },
  });

  const colInProgress = await prisma.column.create({
    data: {
      name: 'In Progress',
      position: 2000,
      boardId: hydBoard.id,
      tenantId: hyderabad.id,
    },
  });

  const colTesting = await prisma.column.create({
    data: {
      name: 'Testing',
      position: 3000,
      boardId: hydBoard.id,
      tenantId: hyderabad.id,
    },
  });

  const colDone = await prisma.column.create({
    data: {
      name: 'Done',
      position: 4000,
      boardId: hydBoard.id,
      tenantId: hyderabad.id,
    },
  });

  // 8. Create Sample Tasks for Hyderabad Board
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Multi-Tenant Database Schema',
      description: 'Implement PostgreSQL schema with strict tenant isolation foreign keys and indexes.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: hydBoard.id,
      columnId: colDone.id,
      tenantId: hyderabad.id,
      assignedToId: rahul.id,
      createdById: priya.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Develop Real-Time WebSocket Rooms',
      description: 'Configure Socket.IO with JWT handshake and tenant-scoped room partitioning.',
      position: 1000,
      version: 1,
      priority: 'URGENT',
      boardId: hydBoard.id,
      columnId: colInProgress.id,
      tenantId: hyderabad.id,
      assignedToId: arjun.id,
      createdById: priya.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Implement Optimistic UI Updates & Undo/Redo',
      description: 'Support seamless drag-and-drop with Redux state rollback on version conflict.',
      position: 1000,
      version: 1,
      priority: 'MEDIUM',
      boardId: hydBoard.id,
      columnId: colTodo.id,
      tenantId: hyderabad.id,
      assignedToId: arjun.id,
      createdById: rahul.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Security Audit & RBAC Enforcement',
      description: 'Verify cross-tenant data isolation and ensure 403 Forbidden on forged tenant IDs.',
      position: 2000,
      version: 1,
      priority: 'HIGH',
      boardId: hydBoard.id,
      columnId: colTesting.id,
      tenantId: hyderabad.id,
      assignedToId: priya.id,
      createdById: rahul.id,
    },
  });

  // 9. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        tenantId: hyderabad.id,
        userId: priya.id,
        entityType: 'BOARD',
        entityId: hydBoard.id,
        action: 'CREATED',
        details: { boardName: hydBoard.name },
      },
      {
        tenantId: hyderabad.id,
        userId: arjun.id,
        entityType: 'TASK',
        entityId: task2.id,
        action: 'MOVED',
        details: { fromColumn: 'To Do', toColumn: 'In Progress' },
      },
      {
        tenantId: hyderabad.id,
        userId: rahul.id,
        entityType: 'TASK',
        entityId: task1.id,
        action: 'MOVED',
        details: { fromColumn: 'Testing', toColumn: 'Done' },
      },
    ],
  });

  // 10. Create Board for Bangalore Branch (to demonstrate data isolation)
  const blrBoard = await prisma.board.create({
    data: {
      name: 'Cloud Infrastructure Migration',
      description: 'Bangalore branch cloud migration initiatives',
      organizationId: abcTech.id,
      tenantId: bangalore.id,
      createdById: sneha.id,
    },
  });

  const blrCol1 = await prisma.column.create({
    data: {
      name: 'Backlog',
      position: 1000,
      boardId: blrBoard.id,
      tenantId: bangalore.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup Kubernetes Clusters in AWS',
      description: 'Bangalore internal task - completely isolated from Hyderabad branch',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: blrBoard.id,
      columnId: blrCol1.id,
      tenantId: bangalore.id,
      assignedToId: sneha.id,
      createdById: sneha.id,
    },
  });

  console.log('✅ Database seeded successfully with demo data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
