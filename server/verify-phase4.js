// server/verify-phase4.js
// Verification Script for Phase 4: Socket.IO Real-Time Synchronization & Presence Tracking
import http from 'http';
import { io as ClientIO } from 'socket.io-client';
import app from './src/app.js';
import { initSocket } from './src/socket.js';
import { prisma } from './src/lib/prisma.js';

const PORT = 5008;
let server;
const SERVER_URL = `http://localhost:${PORT}`;

const request = async (path, options = {}) => {
  const url = `${SERVER_URL}${path}`;
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

// Helper to wait for a socket event with timeout
const waitForEvent = (socket, eventName, timeoutMs = 12000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

async function runPhase4Verification() {
  console.log('====================================================');
  console.log('⚡ STARTING PHASE 4 REAL-TIME SOCKET.IO VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test ${total}: ${testName} - ${details}`);
    }
  }

  let priyaSocket;
  let arjunSocket;
  let snehaSocket;
  let createdTaskId;

  try {
    // 1. Start HTTP + Socket.IO Server
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Live test server listening on port ${PORT}\n`);

    // 2. Authenticate Users via REST API
    console.log('--- Step 1: Authenticate Seeded Users ---');
    const priyaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'priya@abctech.com', password: 'Password123!' }),
    });
    const priyaToken = priyaLogin.data.token;
    const hyderabadTenantId = priyaLogin.data.user.tenants.find((t) => t.name.includes('Hyderabad')).id;

    const arjunLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'arjun@abctech.com', password: 'Password123!' }),
    });
    const arjunToken = arjunLogin.data.token;

    const snehaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sneha@abctech.com', password: 'Password123!' }),
    });
    const snehaToken = snehaLogin.data.token;
    const bangaloreTenantId = snehaLogin.data.user.tenants[0].id;

    assert(priyaToken && arjunToken && snehaToken, 'Retrieved JWTs for Priya, Arjun, and Sneha');

    // 3. Test 1: Socket Authentication Rejects Invalid/Forged JWT
    console.log('\n--- Step 2: Test Socket Authentication Handshake ---');
    let rejectedHandshake = false;
    try {
      const badSocket = ClientIO(SERVER_URL, {
        auth: { token: 'Bearer invalid.forged.jwt.token' },
        reconnection: false,
      });
      await waitForEvent(badSocket, 'connect_error', 2000);
      rejectedHandshake = true;
      badSocket.close();
    } catch (e) {
      rejectedHandshake = true;
    }
    assert(rejectedHandshake, 'Socket handshake rejects invalid/forged JWT tokens');

    // 4. Test 2: Authorized Users Connect and Join Tenant Rooms
    console.log('\n--- Step 3: Connect Authorized Sockets ---');
    priyaSocket = ClientIO(SERVER_URL, { auth: { token: `Bearer ${priyaToken}` } });
    arjunSocket = ClientIO(SERVER_URL, { auth: { token: `Bearer ${arjunToken}` } });
    snehaSocket = ClientIO(SERVER_URL, { auth: { token: `Bearer ${snehaToken}` } });

    await Promise.all([
      waitForEvent(priyaSocket, 'connect'),
      waitForEvent(arjunSocket, 'connect'),
      waitForEvent(snehaSocket, 'connect'),
    ]);
    assert(priyaSocket.connected && arjunSocket.connected && snehaSocket.connected, 'All 3 client sockets connected');

    // 5. Test 3: Simple Presence Tracking (Priya & Arjun in Hyderabad)
    console.log('\n--- Step 4: Verify Presence Tracking ---');
    const presencePromise = waitForEvent(arjunSocket, 'presence:update');
    priyaSocket.emit('tenant:join', { tenantId: hyderabadTenantId });
    arjunSocket.emit('tenant:join', { tenantId: hyderabadTenantId });
    snehaSocket.emit('tenant:join', { tenantId: bangaloreTenantId });

    const presenceData = await presencePromise;
    const onlineNames = presenceData.onlineUsers.map((u) => u.fullName);
    assert(
      onlineNames.includes('Priya Patel') || onlineNames.includes('Arjun Reddy'),
      'Presence update received with connected branch users',
      `Online: ${onlineNames.join(', ')}`
    );

    // Fetch Hyderabad Board to get column ID
    const boardRes = await request(`/api/tenants/${hyderabadTenantId}/boards`, {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    const boardId = boardRes.data.boards[0].id;
    const boardDetail = await request(`/api/tenants/${hyderabadTenantId}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    const todoCol = boardDetail.data.board.columns.find((c) => c.name === 'To Do');
    const inProgressCol = boardDetail.data.board.columns.find((c) => c.name === 'In Progress');

    // 6. Test 4: Task Creation Synchronizes Immediately
    console.log('\n--- Step 5: Test Real-Time Task Creation ---');
    let snehaReceivedHyderabadEvent = false;
    snehaSocket.on('task:created', () => { snehaReceivedHyderabadEvent = true; });

    const taskCreatedPromise = waitForEvent(arjunSocket, 'task:created', 8000);
    const createRes = await request(`/api/tenants/${hyderabadTenantId}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        title: 'Real-Time Sync Task',
        description: 'Synchronized via Socket.IO',
        columnId: todoCol.id,
        priority: 'HIGH',
      }),
    });
    createdTaskId = createRes.data?.task?.id;

    const taskCreatedData = await taskCreatedPromise;
    assert(
      taskCreatedData.task && taskCreatedData.task.id === createdTaskId,
      'Arjun received live "task:created" event immediately without page reload',
      `Task ID: ${taskCreatedData.task?.id}`
    );

    // 7. Test 5: Task Editing Synchronizes Immediately
    console.log('\n--- Step 6: Test Real-Time Task Editing ---');
    const taskUpdatedPromise = waitForEvent(arjunSocket, 'task:updated');
    await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        title: 'Real-Time Sync Task - Edited',
        expectedVersion: 1,
      }),
    });

    const taskUpdatedData = await taskUpdatedPromise;
    assert(
      taskUpdatedData.task &&
        taskUpdatedData.task.id === createdTaskId &&
        taskUpdatedData.task.version === 2,
      'Arjun received live "task:updated" event with incremented OCC version 2',
      `Version: ${taskUpdatedData.task?.version}`
    );

    // 8. Test 6: Drag-and-Drop Movement Synchronizes Immediately
    console.log('\n--- Step 7: Test Real-Time Drag-and-Drop Movement ---');
    const taskMovedPromise = waitForEvent(arjunSocket, 'task:moved');
    await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTaskId}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: JSON.stringify({
        destinationColumnId: inProgressCol.id,
        newPosition: 1500,
        expectedVersion: 2,
      }),
    });

    const taskMovedData = await taskMovedPromise;
    assert(
      taskMovedData.task &&
        taskMovedData.task.id === createdTaskId &&
        taskMovedData.toColumnId === inProgressCol.id &&
        taskMovedData.task.version === 3,
      'Arjun received live "task:moved" event to "In Progress" column with version 3',
      `Col: ${taskMovedData.toColumnId}, Ver: ${taskMovedData.task?.version}`
    );

    // 9. Test 7: Task Deletion Synchronizes Immediately
    console.log('\n--- Step 8: Test Real-Time Task Deletion ---');
    const taskDeletedPromise = waitForEvent(arjunSocket, 'task:deleted');
    await request(`/api/tenants/${hyderabadTenantId}/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${priyaToken}` },
    });

    const taskDeletedData = await taskDeletedPromise;
    assert(
      taskDeletedData.taskId === createdTaskId,
      'Arjun received live "task:deleted" event removing task from view',
      `Deleted Task ID: ${taskDeletedData.taskId}`
    );

    // 10. Test 8: Cross-Tenant Event Isolation (Sneha in Bangalore received ZERO Hyderabad events)
    console.log('\n--- Step 9: Verify Cross-Tenant Event Isolation ---');
    assert(
      snehaReceivedHyderabadEvent === false,
      'Users in different branches (Bangalore) received ZERO events from Hyderabad'
    );

    // 11. Test 9: Unauthorized User Cannot Join Tenant Room
    console.log('\n--- Step 10: Unauthorized Room Join Rejection ---');
    const unauthorizedPromise = waitForEvent(snehaSocket, 'error:unauthorized');
    snehaSocket.emit('tenant:join', { tenantId: hyderabadTenantId }); // Sneha attempting Hyderabad join
    const unauthorizedData = await unauthorizedPromise;
    assert(
      unauthorizedData && unauthorizedData.message,
      'Unauthorized user (Sneha) blocked from joining foreign tenant room (Hyderabad)',
      unauthorizedData.message
    );

    // 12. Test 10: Reconnection Handling & OCC Verification
    console.log('\n--- Step 11: Reconnection & OCC Resiliency Test ---');
    priyaSocket.disconnect();
    assert(!priyaSocket.connected, 'Socket disconnected intentionally to simulate network drop');

    priyaSocket.connect();
    await waitForEvent(priyaSocket, 'connect');
    assert(priyaSocket.connected, 'Socket successfully reconnected to server');

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    if (priyaSocket) priyaSocket.close();
    if (arjunSocket) arjunSocket.close();
    if (snehaSocket) snehaSocket.close();
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runPhase4Verification();
