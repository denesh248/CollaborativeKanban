import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for ONE main company with multiple branches...');

  // 1. Clean existing records in reverse dependency order
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // 2. Default password hash for all demo accounts: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // =========================================================================
  // ONE MAIN COMPANY: Apex Global Technologies
  // =========================================================================
  const company = await prisma.organization.create({
    data: {
      name: 'Apex Global Technologies',
    },
  });
  console.log(`🏢 Created Single Main Company: ${company.name}`);

  // =========================================================================
  // 5 BRANCHES (TENANTS) UNDER APEX GLOBAL TECHNOLOGIES
  // =========================================================================
  const hydTenant = await prisma.tenant.create({
    data: {
      name: 'Hyderabad Engineering Hub',
      organizationId: company.id,
    },
  });

  const blrTenant = await prisma.tenant.create({
    data: {
      name: 'Bangalore Cloud Campus',
      organizationId: company.id,
    },
  });

  const chnTenant = await prisma.tenant.create({
    data: {
      name: 'Chennai Delivery Center',
      organizationId: company.id,
    },
  });

  const puneTenant = await prisma.tenant.create({
    data: {
      name: 'Pune AI & Analytics Lab',
      organizationId: company.id,
    },
  });

  const mumTenant = await prisma.tenant.create({
    data: {
      name: 'Mumbai Fintech Division',
      organizationId: company.id,
    },
  });

  console.log('📍 Created 5 Branches: Hyderabad, Bangalore, Chennai, Pune, Mumbai.');

  // =========================================================================
  // USERS (ALL BELONGING TO APEX GLOBAL TECHNOLOGIES)
  // =========================================================================
  const rahul = await prisma.user.create({
    data: {
      email: 'rahul@apextech.com',
      fullName: 'Rahul Sharma',
      passwordHash,
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@apextech.com',
      fullName: 'Priya Patel',
      passwordHash,
    },
  });

  const arjun = await prisma.user.create({
    data: {
      email: 'arjun@apextech.com',
      fullName: 'Arjun Reddy',
      passwordHash,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      email: 'sneha@apextech.com',
      fullName: 'Sneha Rao',
      passwordHash,
    },
  });

  const vikram = await prisma.user.create({
    data: {
      email: 'vikram@apextech.com',
      fullName: 'Vikram Das',
      passwordHash,
    },
  });

  const ananya = await prisma.user.create({
    data: {
      email: 'ananya@apextech.com',
      fullName: 'Ananya Verma',
      passwordHash,
    },
  });

  const karthik = await prisma.user.create({
    data: {
      email: 'karthik@apextech.com',
      fullName: 'Karthik Iyer',
      passwordHash,
    },
  });

  const rohit = await prisma.user.create({
    data: {
      email: 'rohit@apextech.com',
      fullName: 'Rohit Mehta',
      passwordHash,
    },
  });

  const neha = await prisma.user.create({
    data: {
      email: 'neha@apextech.com',
      fullName: 'Neha Kapoor',
      passwordHash,
    },
  });

  console.log('👤 Created 9 Apex Global users.');

  // =========================================================================
  // RBAC MEMBERSHIPS
  // =========================================================================
  // Rahul: ORG_ADMIN with company-wide access to all 5 branches
  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: company.id,
      tenantId: null, // Company-wide administrator
      role: 'ORG_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: company.id,
      tenantId: hydTenant.id,
      role: 'ORG_ADMIN',
    },
  });

  // Hyderabad: Priya (Tenant Admin), Arjun (Member)
  await prisma.membership.create({
    data: {
      userId: priya.id,
      organizationId: company.id,
      tenantId: hydTenant.id,
      role: 'TENANT_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: arjun.id,
      organizationId: company.id,
      tenantId: hydTenant.id,
      role: 'MEMBER',
    },
  });

  // Bangalore: Sneha (Tenant Admin)
  await prisma.membership.create({
    data: {
      userId: sneha.id,
      organizationId: company.id,
      tenantId: blrTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Chennai: Vikram (Member)
  await prisma.membership.create({
    data: {
      userId: vikram.id,
      organizationId: company.id,
      tenantId: chnTenant.id,
      role: 'MEMBER',
    },
  });

  // Pune: Ananya (Tenant Admin), Karthik (Member)
  await prisma.membership.create({
    data: {
      userId: ananya.id,
      organizationId: company.id,
      tenantId: puneTenant.id,
      role: 'TENANT_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: karthik.id,
      organizationId: company.id,
      tenantId: puneTenant.id,
      role: 'MEMBER',
    },
  });

  // Mumbai: Rohit (Tenant Admin), Neha (Member)
  await prisma.membership.create({
    data: {
      userId: rohit.id,
      organizationId: company.id,
      tenantId: mumTenant.id,
      role: 'TENANT_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: neha.id,
      organizationId: company.id,
      tenantId: mumTenant.id,
      role: 'MEMBER',
    },
  });

  console.log('🛡️ Assigned RBAC roles across all branches.');

  // =========================================================================
  // BOARDS, COLUMNS & TASKS FOR EACH BRANCH
  // =========================================================================

  // --- BRANCH 1: Hyderabad Engineering Hub ---
  const hydBoard = await prisma.board.create({
    data: {
      name: 'Product Platform Engineering',
      description: 'Core platform architecture and backend sprint board',
      organizationId: company.id,
      tenantId: hydTenant.id,
      createdById: priya.id,
    },
  });

  const hydTodo = await prisma.column.create({
    data: { name: 'To Do', position: 1000, boardId: hydBoard.id, tenantId: hydTenant.id },
  });
  const hydInProgress = await prisma.column.create({
    data: { name: 'In Progress', position: 2000, boardId: hydBoard.id, tenantId: hydTenant.id },
  });
  const hydTesting = await prisma.column.create({
    data: { name: 'Testing', position: 3000, boardId: hydBoard.id, tenantId: hydTenant.id },
  });
  const hydDone = await prisma.column.create({
    data: { name: 'Done', position: 4000, boardId: hydBoard.id, tenantId: hydTenant.id },
  });

  const task1 = await prisma.task.create({
    data: {
      title: 'Architect Multi-Tenant Database Core',
      description: 'Configure tenant foreign-key isolation and connection pooling for enterprise scaling.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: hydBoard.id,
      columnId: hydDone.id,
      tenantId: hydTenant.id,
      assignedToId: rahul.id,
      createdById: priya.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement Real-Time WebSocket Rooms',
      description: 'Partition Socket.IO channels strictly per branch to isolate live task mutations.',
      position: 1000,
      version: 1,
      priority: 'URGENT',
      boardId: hydBoard.id,
      columnId: hydInProgress.id,
      tenantId: hydTenant.id,
      assignedToId: arjun.id,
      createdById: priya.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Optimistic UI Updates & OCC Concurrency',
      description: 'Zero-flicker client updates with conflict handling via version headers.',
      position: 1000,
      version: 1,
      priority: 'MEDIUM',
      boardId: hydBoard.id,
      columnId: hydTodo.id,
      tenantId: hydTenant.id,
      assignedToId: arjun.id,
      createdById: rahul.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Branch Security & Isolation Audit',
      description: 'Verify 403 Forbidden on forged tenant headers across REST & WebSockets.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: hydBoard.id,
      columnId: hydTesting.id,
      tenantId: hydTenant.id,
      assignedToId: priya.id,
      createdById: rahul.id,
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        tenantId: hydTenant.id,
        userId: priya.id,
        entityType: 'BOARD',
        entityId: hydBoard.id,
        action: 'CREATED',
        details: { boardName: hydBoard.name },
      },
      {
        tenantId: hydTenant.id,
        userId: arjun.id,
        entityType: 'TASK',
        entityId: task2.id,
        action: 'MOVED',
        details: { fromColumn: 'To Do', toColumn: 'In Progress' },
      },
      {
        tenantId: hydTenant.id,
        userId: rahul.id,
        entityType: 'TASK',
        entityId: task1.id,
        action: 'MOVED',
        details: { fromColumn: 'Testing', toColumn: 'Done' },
      },
    ],
  });

  // --- BRANCH 2: Bangalore Cloud Campus ---
  const blrBoard = await prisma.board.create({
    data: {
      name: 'Cloud Infrastructure & Kubernetes',
      description: 'Bangalore cloud infrastructure provisioning and CI/CD pipelines',
      organizationId: company.id,
      tenantId: blrTenant.id,
      createdById: sneha.id,
    },
  });

  const blrCol1 = await prisma.column.create({
    data: { name: 'Backlog', position: 1000, boardId: blrBoard.id, tenantId: blrTenant.id },
  });
  const blrCol2 = await prisma.column.create({
    data: { name: 'In Deployment', position: 2000, boardId: blrBoard.id, tenantId: blrTenant.id },
  });
  const blrCol3 = await prisma.column.create({
    data: { name: 'Live Production', position: 3000, boardId: blrBoard.id, tenantId: blrTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'Multi-Region Kubernetes Cluster Setup',
      description: 'Provision AWS EKS clusters with autoscaling nodes across ap-south-1 zones.',
      position: 1000,
      version: 1,
      priority: 'URGENT',
      boardId: blrBoard.id,
      columnId: blrCol2.id,
      tenantId: blrTenant.id,
      assignedToId: sneha.id,
      createdById: sneha.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'PostgreSQL Read Replicas & Monitoring',
      description: 'Configure automated failover with Prometheus metrics alerts.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: blrBoard.id,
      columnId: blrCol1.id,
      tenantId: blrTenant.id,
      assignedToId: sneha.id,
      createdById: sneha.id,
    },
  });

  // --- BRANCH 3: Chennai Delivery Center ---
  const chnBoard = await prisma.board.create({
    data: {
      name: 'Client QA & Release Automation',
      description: 'Chennai branch test coverage and release certification',
      organizationId: company.id,
      tenantId: chnTenant.id,
      createdById: vikram.id,
    },
  });

  const chnCol1 = await prisma.column.create({
    data: { name: 'Requirements', position: 1000, boardId: chnBoard.id, tenantId: chnTenant.id },
  });
  const chnCol2 = await prisma.column.create({
    data: { name: 'Active Testing', position: 2000, boardId: chnBoard.id, tenantId: chnTenant.id },
  });
  const chnCol3 = await prisma.column.create({
    data: { name: 'Certified', position: 3000, boardId: chnBoard.id, tenantId: chnTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'End-to-End Cypress Integration Suite',
      description: 'Automate cross-tenant security and drag-and-drop regression workflows.',
      position: 1000,
      version: 1,
      priority: 'MEDIUM',
      boardId: chnBoard.id,
      columnId: chnCol2.id,
      tenantId: chnTenant.id,
      assignedToId: vikram.id,
      createdById: vikram.id,
    },
  });

  // --- BRANCH 4: Pune AI & Analytics Lab ---
  const puneBoard = await prisma.board.create({
    data: {
      name: 'Enterprise AI & Machine Learning',
      description: 'Pune lab large language models, inference engines, and RAG pipelines',
      organizationId: company.id,
      tenantId: puneTenant.id,
      createdById: ananya.id,
    },
  });

  const puneCol1 = await prisma.column.create({
    data: { name: 'Data Ingestion', position: 1000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });
  const puneCol2 = await prisma.column.create({
    data: { name: 'Model Training', position: 2000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });
  const puneCol3 = await prisma.column.create({
    data: { name: 'Inference Ready', position: 3000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'Fine-Tune Embedding Models on vLLM',
      description: 'Train transformer weights using LoRA adapters on GPU cluster instances.',
      position: 1000,
      version: 1,
      priority: 'URGENT',
      boardId: puneBoard.id,
      columnId: puneCol2.id,
      tenantId: puneTenant.id,
      assignedToId: karthik.id,
      createdById: ananya.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Domain Vector Database Indexing',
      description: 'Ingest enterprise documentation vectors with cosine distance matching.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: puneBoard.id,
      columnId: puneCol1.id,
      tenantId: puneTenant.id,
      assignedToId: ananya.id,
      createdById: ananya.id,
    },
  });

  // --- BRANCH 5: Mumbai Fintech Division ---
  const mumBoard = await prisma.board.create({
    data: {
      name: 'Payment Gateway & PCI Compliance',
      description: 'Mumbai fintech transactions and tokenized payment security',
      organizationId: company.id,
      tenantId: mumTenant.id,
      createdById: rohit.id,
    },
  });

  const mumCol1 = await prisma.column.create({
    data: { name: 'Discovery', position: 1000, boardId: mumBoard.id, tenantId: mumTenant.id },
  });
  const mumCol2 = await prisma.column.create({
    data: { name: 'Security Audit', position: 2000, boardId: mumBoard.id, tenantId: mumTenant.id },
  });
  const mumCol3 = await prisma.column.create({
    data: { name: 'Production Ready', position: 3000, boardId: mumBoard.id, tenantId: mumTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'Implement Tokenized Card Vault',
      description: 'Hardware security module (HSM) key rotation and PCI-DSS compliance verification.',
      position: 1000,
      version: 1,
      priority: 'URGENT',
      boardId: mumBoard.id,
      columnId: mumCol2.id,
      tenantId: mumTenant.id,
      assignedToId: neha.id,
      createdById: rohit.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'High-Throughput Settlement Engine',
      description: 'Process batch settlements under 100ms with idempotency keys.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: mumBoard.id,
      columnId: mumCol1.id,
      tenantId: mumTenant.id,
      assignedToId: rohit.id,
      createdById: rohit.id,
    },
  });

  console.log('\n=============================================================');
  console.log('✅ DATABASE SEEDED FOR ONE MAIN COMPANY WITH 5 BRANCHES!');
  console.log('   - Main Company: Apex Global Technologies');
  console.log('   - 5 Branch Tenants: Hyderabad, Bangalore, Chennai, Pune, Mumbai');
  console.log('   - 9 Demo Users (All @apextech.com with Password123!)');
  console.log('   - 5 Kanban Boards with columns, tasks, & OCC versioning');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
