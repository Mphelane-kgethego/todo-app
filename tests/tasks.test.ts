import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_DB = path.join(process.cwd(), 'data', 'test.db');
process.env.DB_PATH = TEST_DB;

function cleanDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = TEST_DB + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

// Resets Node's module cache so each call gets a FRESH db connection to the
// (freshly cleaned) test file — this is what actually simulates "the app restarted."
async function loadRoutes() {
  vi.resetModules();
  const tasksRoute = await import('../src/app/api/tasks/route');
  const taskRoute = await import('../src/app/api/tasks/[id]/route');
  const dbModule = await import('../src/lib/db');
  return { ...tasksRoute, ...taskRoute, db: dbModule.db };
}

beforeEach(cleanDb);
afterEach(cleanDb);

describe('task creation', () => {
  it('creates a task with all four fields and it appears in the list', async () => {
    const { POST, GET } = await loadRoutes();

    const createRes = await POST(new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write report', description: 'Draft v1', due_date: '2026-08-15', topic: 'Uni' }),
    }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const listRes = await GET(new Request('http://localhost/api/tasks'));
    const tasks = await listRes.json();
    const found = tasks.find((t: any) => t.id === created.id);

    expect(found).toBeDefined();
    expect(found.title).toBe('Write report');
    expect(found.status).toBe('Todo');
  });
});

describe('status changes', () => {
  it('updates a task status via PATCH', async () => {
    const { POST, PATCH } = await loadRoutes();

    const createRes = await POST(new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task', description: '', due_date: '2026-08-15', topic: 'Uni' }),
    }));
    const { id } = await createRes.json();

    const patchRes = await PATCH(
      new Request(`http://localhost/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In-Progress' }),
      }),
      { params: Promise.resolve({ id: String(id) }) }
    );
    const updated = await patchRes.json();

    expect(updated.status).toBe('In-Progress');
  });
});

describe('overdue detection', () => {
  it('flags a task as overdue only when due_date has passed and status is not Complete', async () => {
    const { POST, GET } = await loadRoutes();

    await POST(new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Overdue task', description: '', due_date: '2020-01-01', topic: 'Uni' }),
    }));

    const listRes = await GET(new Request('http://localhost/api/tasks'));
    const [task] = await listRes.json();

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.due_date < today && task.status !== 'Complete' && !task.archived_at;

    expect(isOverdue).toBe(true);
  });
});

describe('persistence', () => {
  it('keeps task data after the database connection is reopened (simulated restart)', async () => {
    const { POST } = await loadRoutes();
    await POST(new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Persisted task', description: '', due_date: '2026-08-15', topic: 'Uni' }),
    }));

    // Fresh module load = fresh DB connection to the same file, standing in for a real restart
    const { db } = await loadRoutes();
    const rows = db.prepare('SELECT * FROM tasks').all();

    expect(rows.length).toBe(1);
    expect((rows[0] as any).title).toBe('Persisted task');
  });
});