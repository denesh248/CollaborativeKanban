import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with multi-organization enterprise data...');

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

  // 2. Default password hash for all demo accounts: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // =========================================================================
  // ORGANIZATION 1: Apex Global Technologies
  // =========================================================================
  const apexOrg = await prisma.organization.create({
    data: {
      name: 'Apex Global Technologies',
    },
  });
  console.log(`🏢 Created Organization 1: ${apexOrg.name}`);

  // Apex Tenants (Branches)
  const hydTenant = await prisma.tenant.create({
    data: {
      name: 'Hyderabad Engineering Hub',
      organizationId: apexOrg.id,
    },
  });

  const blrTenant = await prisma.tenant.create({
    data: {
      name: 'Bangalore Innovation Lab',
      organizationId: apexOrg.id,
    },
  });

  const chnTenant = await prisma.tenant.create({
    data: {
      name: 'Chennai Delivery Center',
      organizationId: apexOrg.id,
    },
  });
  console.log('📍 Created Apex Tenants: Hyderabad, Bangalore, Chennai.');

  // Apex Users
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

  // Apex Memberships
  // Rahul: Org Admin with company-wide branch access
  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: apexOrg.id,
      tenantId: null,
      role: 'ORG_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: rahul.id,
      organizationId: apexOrg.id,
      tenantId: hydTenant.id,
      role: 'ORG_ADMIN',
    },
  });

  // Priya: Tenant Admin for Hyderabad
  await prisma.membership.create({
    data: {
      userId: priya.id,
      organizationId: apexOrg.id,
      tenantId: hydTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Arjun: Member in Hyderabad
  await prisma.membership.create({
    data: {
      userId: arjun.id,
      organizationId: apexOrg.id,
      tenantId: hydTenant.id,
      role: 'MEMBER',
    },
  });

  // Sneha: Tenant Admin for Bangalore
  await prisma.membership.create({
    data: {
      userId: sneha.id,
      organizationId: apexOrg.id,
      tenantId: blrTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Vikram: Member in Chennai
  await prisma.membership.create({
    data: {
      userId: vikram.id,
      organizationId: apexOrg.id,
      tenantId: chnTenant.id,
      role: 'MEMBER',
    },
  });

  // Hyderabad Board & Tasks
  const hydBoard = await prisma.board.create({
    data: {
      name: 'Product Platform Engineering',
      description: 'Core sprint workspace for Hyderabad platform team',
      organizationId: apexOrg.id,
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
      title: 'Architect Event-Driven Multi-Tenant Core',
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
      title: 'Cross-Tenant Security Audit',
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

  // Hyderabad Activity Logs
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

  // Bangalore Board & Tasks
  const blrBoard = await prisma.board.create({
    data: {
      name: 'Cloud Infrastructure & DevOps',
      description: 'Bangalore team infrastructure provisioning and CI/CD pipelines',
      organizationId: apexOrg.id,
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
      description: 'Provision EKS clusters with autoscaling nodes across ap-south-1 availability zones.',
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

  // Chennai Board & Tasks
  const chnBoard = await prisma.board.create({
    data: {
      name: 'Client Delivery & QA Automation',
      description: 'Chennai branch test coverage and release certification',
      organizationId: apexOrg.id,
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

  // =========================================================================
  // ORGANIZATION 2: Nexus Cloud Systems (Completely separate organization)
  // =========================================================================
  const nexusOrg = await prisma.organization.create({
    data: {
      name: 'Nexus Cloud Systems',
    },
  });
  console.log(`🏢 Created Organization 2: ${nexusOrg.name}`);

  // Nexus Tenants (Branches)
  const puneTenant = await prisma.tenant.create({
    data: {
      name: 'Pune AI & Analytics Lab',
      organizationId: nexusOrg.id,
    },
  });

  const mumTenant = await prisma.tenant.create({
    data: {
      name: 'Mumbai Fintech Hub',
      organizationId: nexusOrg.id,
    },
  });
  console.log('📍 Created Nexus Tenants: Pune, Mumbai.');

  // Nexus Users
  const ananya = await prisma.user.create({
    data: {
      email: 'ananya@nexuscloud.io',
      fullName: 'Ananya Verma',
      passwordHash,
    },
  });

  const karthik = await prisma.user.create({
    data: {
      email: 'karthik@nexuscloud.io',
      fullName: 'Karthik Iyer',
      passwordHash,
    },
  });

  const rohit = await prisma.user.create({
    data: {
      email: 'rohit@nexuscloud.io',
      fullName: 'Rohit Mehta',
      passwordHash,
    },
  });

  // Nexus Memberships
  // Ananya: Org Admin across Nexus Cloud
  await prisma.membership.create({
    data: {
      userId: ananya.id,
      organizationId: nexusOrg.id,
      tenantId: null,
      role: 'ORG_ADMIN',
    },
  });
  await prisma.membership.create({
    data: {
      userId: ananya.id,
      organizationId: nexusOrg.id,
      tenantId: puneTenant.id,
      role: 'ORG_ADMIN',
    },
  });

  // Karthik: Tenant Admin for Pune
  await prisma.membership.create({
    data: {
      userId: karthik.id,
      organizationId: nexusOrg.id,
      tenantId: puneTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Rohit: Member in Mumbai
  await prisma.membership.create({
    data: {
      userId: rohit.id,
      organizationId: nexusOrg.id,
      tenantId: mumTenant.id,
      role: 'MEMBER',
    },
  });

  // Pune Board & Tasks
  const puneBoard = await prisma.board.create({
    data: {
      name: 'Enterprise AI & NLP Pipeline',
      description: 'Pune lab large language model fine-tuning and inference pipelines',
      organizationId: nexusOrg.id,
      tenantId: puneTenant.id,
      createdById: karthik.id,
    },
  });

  const puneCol1 = await prisma.column.create({
    data: { name: 'Data Ingestion', position: 1000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });
  const puneCol2 = await prisma.column.create({
    data: { name: 'Model Training', position: 2000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });
  const puneCol3 = await prisma.column.create({
    data: { name: 'Evaluation', position: 3000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });
  const puneCol4 = await prisma.column.create({
    data: { name: 'Deployed Service', position: 4000, boardId: puneBoard.id, tenantId: puneTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'Domain Dataset Curation & Cleaning',
      description: 'Prepare sanitized unstructured enterprise documents for RAG embedding generation.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: puneBoard.id,
      columnId: puneCol1.id,
      tenantId: puneTenant.id,
      assignedToId: ananya.id,
      createdById: karthik.id,
    },
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
      createdById: karthik.id,
    },
  });

  // Mumbai Board & Tasks
  const mumBoard = await prisma.board.create({
    data: {
      name: 'Payment Gateway & PCI Compliance',
      description: 'Mumbai fintech transactions and tokenized payment security',
      organizationId: nexusOrg.id,
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
      assignedToId: rohit.id,
      createdById: rohit.id,
    },
  });

  // Activity log for Mumbai
  await prisma.activityLog.create({
    data: {
      tenantId: mumTenant.id,
      userId: rohit.id,
      entityType: 'TASK',
      entityId: mumBoard.id,
      action: 'CREATED',
      details: { taskTitle: 'Implement Tokenized Card Vault', column: 'Security Audit' },
    },
  });

  // =========================================================================
  // ORGANIZATION 3: Pulse Dynamics Global
  // =========================================================================
  const pulseOrg = await prisma.organization.create({
    data: {
      name: 'Pulse Dynamics Global',
    },
  });
  console.log(`🏢 Created Organization 3: ${pulseOrg.name}`);

  const delhiTenant = await prisma.tenant.create({
    data: {
      name: 'Delhi Operations Center',
      organizationId: pulseOrg.id,
    },
  });

  const sameer = await prisma.user.create({
    data: {
      email: 'sameer@pulsedynamics.com',
      fullName: 'Sameer Joshi',
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: {
      userId: sameer.id,
      organizationId: pulseOrg.id,
      tenantId: delhiTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  const delhiBoard = await prisma.board.create({
    data: {
      name: 'Supply Chain & IoT Logistics',
      description: 'Real-time telemetry and dispatch logistics board',
      organizationId: pulseOrg.id,
      tenantId: delhiTenant.id,
      createdById: sameer.id,
    },
  });

  const dCol1 = await prisma.column.create({
    data: { name: 'Incoming Orders', position: 1000, boardId: delhiBoard.id, tenantId: delhiTenant.id },
  });
  const dCol2 = await prisma.column.create({
    data: { name: 'Dispatch & Transit', position: 2000, boardId: delhiBoard.id, tenantId: delhiTenant.id },
  });
  const dCol3 = await prisma.column.create({
    data: { name: 'Delivered', position: 3000, boardId: delhiBoard.id, tenantId: delhiTenant.id },
  });

  await prisma.task.create({
    data: {
      title: 'GPS Sensor Fleet Telemetry Stream',
      description: 'Ingest location telemetry every 5 seconds via MQTT gateway into analytics warehouse.',
      position: 1000,
      version: 1,
      priority: 'HIGH',
      boardId: delhiBoard.id,
      columnId: dCol2.id,
      tenantId: delhiTenant.id,
      assignedToId: sameer.id,
      createdById: sameer.id,
    },
  });

  console.log('\n=============================================================');
  console.log('✅ MULTI-ORGANIZATION DATABASE SEEDED SUCCESSFULLY!');
  console.log('   - 3 Organizations: Apex Global, Nexus Cloud, Pulse Dynamics');
  console.log('   - 6 Branch Tenants');
  console.log('   - 9 Demo Users with bcrypt hashed passwords');
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
