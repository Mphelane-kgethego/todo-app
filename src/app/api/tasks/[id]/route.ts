import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const allowedFields = ['title', 'description', 'due_date', 'topic', 'status', 'archived_at'];
  const updates = Object.keys(body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const setClause = updates.map((field) => `${field} = ?`).join(', ');
  const values = updates.map((field) => body[field]);

  db.prepare(
    `UPDATE tasks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
  ).run(...values, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(updated);
}