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

function statusBadgeClass(status: Task['status'], styles: Record<string, string>): string {
  switch (status) {
    case 'Todo': return styles.badgeTodo;
    case 'In-Progress': return styles.badgeInProgress;
    case 'Complete': return styles.badgeComplete;
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sort, setSort] = useState<'topic' | 'status' | 'due_date'>('due_date');
  const [showArchived, setShowArchived] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('Todo');

  async function loadTasks() {
    const res = await fetch(`/api/tasks?sort=${sort}&includeArchived=${showArchived}`);
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, [sort, showArchived]);

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

  async function archiveTask(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived_at: new Date().toISOString() }),
    });
    loadTasks();
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.due_date);
    setEditTopic(task.topic);
    setEditStatus(task.status);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        due_date: editDueDate,
        topic: editTopic,
        status: editStatus,
      }),
    });
    setEditingId(null);
    loadTasks();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.header}>Todo App</h1>

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
            {editingId === task.id ? (
              <div className={styles.editForm}>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                <input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Topic" />
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Task['status'])}>
                  <option value="Todo">Todo</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Complete">Complete</option>
                </select>
                <div className={styles.editActions}>
                  <button onClick={() => saveEdit(task.id)} className={styles.saveButton}>Save</button>
                  <button onClick={cancelEdit} className={styles.cancelButton}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.cardHeader}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  {!task.archived_at && (
                    <button
                      onClick={() => startEdit(task)}
                      className={styles.editButton}
                      aria-label="Edit task"
                      title="Edit task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className={styles.description}>{task.description}</div>
                <div className={styles.meta}>
                  <span className={styles.badgeTopic}>{task.topic}</span>
                  <span className={statusBadgeClass(task.status, styles)}>{task.status}</span>
                  {isOverdue(task) && <span className={styles.badgeOverdue}>OVERDUE</span>}
                  {task.archived_at && <span className={styles.badgeArchived}>Archived</span>}
                  <span className={styles.dueDate}>Due {task.due_date}</span>
                </div>
                {!task.archived_at && (
                  <button onClick={() => archiveTask(task.id)} className={styles.archiveButton}>
                    Archive
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}