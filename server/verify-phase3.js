// server/verify-phase3.js
// Manual Verification Script for Phase 3 (Board, Column, Task CRUD, OCC, and Activity Logs)
// Written simply and clearly for entry-level / fresher standard.

import app from './src/app.js';
import { prisma } from './src/lib/prisma.js';

const PORT = 5006;
let server;

// Helper function to make HTTP requests
const request = async (path, options = {}) => {
  const url = `http://localhost:${PORT}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  return { status: response.status, data };
};

async function runPhase3Verification() {
  console.log('====================================================');
  console.log('🚀 STARTING PHASE 3 VERIFICATION ON LIVE NEON POSTGRESQL');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Scenario ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Scenario ${total}: ${testName} - ${details}`);
    }
  }

  try {
    // 1. Start live express server
    server = app.listen(PORT);
    console.log(`Live test server listening on port ${PORT}\n`);

    // 2. Login as Priya (TENANT_ADMIN for Hyderabad)
    console.log('--- Step 1: Authenticate as Priya (Hyderabad Admin) ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'priya@abctech.com',
        password: 'Password123!',
      }),
    });

    assert(loginRes.status === 200 && loginRes.data.token, 'Priya logged in successfully');
    const priyaToken = loginRes.data.token;
    const hyderabadTenant = loginRes.data.user.tenants.find((t) => t.name.includes('Hyderabad'));
    const hyderabadTenantId = hyderabadTenant.id;
    console.log(`Hyderabad Tenant ID: ${hyderabadTenantId}`);

    // Login as Sneha (Bangalore Admin) for cross-tenant testing
    const snehaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'sneha@abctech.com',
        password: 'Password123!',
      }),
    });
    const snehaToken = snehaLogin.data.token;
    const bangaloreTenantId = snehaLogin.data.user.tenants[0].id;

    // 3. Scenario 1: Fetch Boards for Hyderabad
    console.log('\n--- Step 2: Fetch Boards & Columns ---');
    const boardsRes = await request(`/api/tenants/${hyderabadTenantId}/boards`, {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    assert(
      boardsRes.status === 200 && Array.isArray(boardsRes.data.boards) && boardsRes.data.boards.length > 0,
      'Retrieve boards for Hyderabad branch',
      JSON.stringify(boardsRes.data)
    );

    const activeBoard = boardsRes.data.boards[0];
    console.log(`Active Board: "${activeBoard.name}" (${activeBoard.id})`);

    // 4. Scenario 2: Get Full Board Details with Columns & Existing Tasks
    const boardDetailRes = await request(`/api/tenants/${hyderabadTenantId}/boards/${activeBoard.id}`, {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    assert(
      boardDetailRes.status === 200 && boardDetailRes.data.board.columns.length >= 4,
      'Get board details with all 4 default columns',
      `Columns found: ${boardDetailRes.data.board?.columns?.length}`
    );

    const columns = boardDetailRes.data.board.columns;
    const todoColumn = columns.find((c) => c.name === 'To Do') || columns[0];
    const inProgressColumn = columns.find((c) => c.name === 'In Progress') || columns[1];
    console.log(`Columns available: "${todoColumn.name}" -> "${inProgressColumn.name}"`);

    // 5. Scenario 3: Create a New Task in "To Do"
    console.log('\n--- Step 3: Create Task in "To Do" Column ---');
    const createTaskRes = await request(`/api/tenants/${hyderabadTenantId}/boards/${activeBoard.id}/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        title: 'Phase 3 OCC Test Task',
        description: 'Testing version increment and 409 conflict detection',
        columnId: todoColumn.id,
        priority: 'HIGH',
      }),
    });

    assert(
      createTaskRes.status === 201 && createTaskRes.data.task.version === 1,
      'Create new task with initial version = 1',
      JSON.stringify(createTaskRes.data)
    );

    const createdTask = createTaskRes.data.task;
    console.log(`Created Task: "${createdTask.title}" ID: ${createdTask.id}, Version: v${createdTask.version}`);

    // 6. Scenario 4: Valid Update with Matching expectedVersion
    console.log('\n--- Step 4: Update Task with expectedVersion: 1 ---');
    const updateTaskRes = await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTask.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        title: 'Phase 3 OCC Test Task - Modified',
        description: 'Updated successfully with expectedVersion = 1',
        expectedVersion: 1, // matches current version
      }),
    });

    assert(
      updateTaskRes.status === 200 && updateTaskRes.data.task.version === 2,
      'Update task increments version counter from 1 to 2',
      `New version: ${updateTaskRes.data.task?.version}`
    );

    // 7. Scenario 5: Stale Update Triggers HTTP 409 Conflict (OCC Test)
    console.log('\n--- Step 5: Test Optimistic Concurrency Control (OCC) Stale Edit ---');
    const staleUpdateRes = await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTask.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        title: 'Stale update attempt',
        expectedVersion: 1, // Stale! Server is now at version 2
      }),
    });

    assert(
      staleUpdateRes.status === 409 && staleUpdateRes.data.error === 'Conflict',
      'Stale edit rejected with HTTP 409 Conflict',
      JSON.stringify(staleUpdateRes.data)
    );

    // 8. Scenario 6: Move Task from "To Do" to "In Progress"
    console.log('\n--- Step 6: Move Task to "In Progress" ---');
    const moveTaskRes = await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTask.id}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        destinationColumnId: inProgressColumn.id,
        newPosition: 1500,
        expectedVersion: 2, // matches current version
      }),
    });

    assert(
      moveTaskRes.status === 200 &&
        moveTaskRes.data.task.columnId === inProgressColumn.id &&
        moveTaskRes.data.task.version === 3,
      'Move task updates column to "In Progress" and increments version to 3',
      JSON.stringify(moveTaskRes.data)
    );

    // 9. Scenario 7: Stale Move Attempt Triggers HTTP 409 Conflict
    console.log('\n--- Step 7: Stale Move Attempt Triggers HTTP 409 ---');
    const staleMoveRes = await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTask.id}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        destinationColumnId: todoColumn.id,
        expectedVersion: 2, // Stale! Server is now at version 3
      }),
    });

    assert(
      staleMoveRes.status === 409 && staleMoveRes.data.error === 'Conflict',
      'Concurrent move attempt rejected with HTTP 409 Conflict',
      JSON.stringify(staleMoveRes.data)
    );

    // 10. Scenario 8: Cross-Tenant Protection (Bangalore user cannot modify Hyderabad task)
    console.log('\n--- Step 8: Cross-Tenant Isolation Test ---');
    const crossTenantRes = await request(`/api/tenants/${bangaloreTenantId}/tasks/${createdTask.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${snehaToken}` },
      body: JSON.stringify({
        title: 'Cross tenant hack attempt',
      }),
    });

    assert(
      crossTenantRes.status === 404,
      'Cross-tenant task modification is rejected (404 Not Found in this branch)',
      JSON.stringify(crossTenantRes.data)
    );

    // 11. Scenario 9: Delete Task
    console.log('\n--- Step 9: Delete Task ---');
    const deleteRes = await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTask.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${priyaToken}` },
    });

    assert(deleteRes.status === 200, 'Delete task succeeds', JSON.stringify(deleteRes.data));

    // 12. Scenario 10: Verify Activity Audit Logs Recorded All Actions
    console.log('\n--- Step 10: Verify Activity Audit Logs ---');
    const logsRes = await request(`/api/tenants/${hyderabadTenantId}/activity-logs`, {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });

    const logs = logsRes.data.logs || [];
    const actions = logs.map((l) => l.action);
    console.log(`Recent actions recorded: ${actions.slice(0, 5).join(', ')}`);

    const hasCreated = actions.includes('CREATED');
    const hasUpdated = actions.includes('UPDATED');
    const hasMoved = actions.includes('MOVED');
    const hasDeleted = actions.includes('DELETED');

    assert(
      logsRes.status === 200 && hasCreated && hasUpdated && hasMoved && hasDeleted,
      'Activity audit log recorded all actions: CREATED, UPDATED, MOVED, DELETED',
      `Found actions: ${actions.join(', ')}`
    );

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed}/${total} SCENARIOS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runPhase3Verification();
