import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') ?? 'due_date';
  const direction = searchParams.get('direction') === 'desc' ? 'DESC' : 'ASC';
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const validSort = ['topic', 'status', 'due_date'].includes(sort) ? sort : 'due_date';

  const rows = db.prepare(
    `SELECT * FROM tasks WHERE (? = 1 OR archived_at IS NULL) ORDER BY ${validSort} ${direction}`
  ).all(includeArchived ? 1 : 0);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const stmt = db.prepare(
    `INSERT INTO tasks (title, description, due_date, topic) VALUES (?, ?, ?, ?)`
  );
  const result = stmt.run(body.title, body.description ?? '', body.due_date, body.topic);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}