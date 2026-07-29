'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type Task = {
  id: number;
  title: string;
  description: string;
  due_date: string;
  topic: string;
  status: 'Todo' | 'In-Progress' | 'Complete';
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function isOverdue(task: Task): boolean {
  const today = new Date().toISOString().split('T')[0];
  return task.due_date < today && task.status !== 'Complete' && !task.archived_at;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sort, setSort] = useState<'topic' | 'status' | 'due_date'>('due_date');
  const [showArchived, setShowArchived] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTopic, setNewTopic] = useState('');

  async function loadTasks() {
    const res = await fetch(`/api/tasks?sort=${sort}&includeArchived=${showArchived}`);
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, [sort, showArchived]);

  async function archiveTask(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived_at: new Date().toISOString() }),
    });
    loadTasks();
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
        due_date: newDueDate,
        topic: newTopic,
      }),
    });
    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setNewTopic('');
    loadTasks();
  }

  return (
    <main className={styles.main}>
      <h1>Todo App</h1>

      <form onSubmit={createTask} className={styles.form}>
        <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        <textarea placeholder="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} required />
        <input placeholder="Topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required />
        <button type="submit">Add Task</button>
      </form>

      <div className={styles.controls}>
        <label>
          Sort by:{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="due_date">Due Date</option>
            <option value="topic">Topic</option>
            <option value="status">Status</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {' '}Show archived
        </label>
      </div>

      <ul className={styles.list}>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={isOverdue(task) ? styles.taskCardOverdue : styles.taskCard}
          >
            <strong>{task.title}</strong>{' '}
            {isOverdue(task) && <span className={styles.overdueLabel}>OVERDUE</span>}
            {task.archived_at && <span className={styles.archivedLabel}> (archived)</span>}
            <div>{task.description}</div>
            <div className={styles.meta}>
              Topic: {task.topic} · Due: {task.due_date} · Status: {task.status}
            </div>
            {!task.archived_at && (
              <button onClick={() => archiveTask(task.id)} className={styles.archiveButton}>
                Archive
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}