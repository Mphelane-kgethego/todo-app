'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [dueDateDirection, setDueDateDirection] = useState<'asc' | 'desc'>('asc');
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

  const [statusFilter, setStatusFilter] = useState<Set<Task['status']>>(new Set());
  const [topicFilter, setTopicFilter] = useState<Set<string>>(new Set());
  const [topicInput, setTopicInput] = useState('');
  const [openFilterKey, setOpenFilterKey] = useState<'status' | 'topic' | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  async function loadTasks() {
    const direction = sort === 'due_date' ? dueDateDirection : 'asc';
    const res = await fetch(`/api/tasks?sort=${sort}&direction=${direction}&includeArchived=${showArchived}`);
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, [sort, dueDateDirection, showArchived]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) {
        setOpenFilterKey(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  function toggleStatusFilter(status: Task['status']) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      if (next.size === 0 && sort === 'status') {
        setSort('due_date');
      }
      return next;
    });
  }

  function toggleTopicFilter(topic: string) {
    setTopicFilter((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      if (next.size === 0 && sort === 'topic') {
        setSort('due_date');
      }
      return next;
    });
  }

  function addCustomTopicFilter() {
    const t = topicInput.trim();
    if (t) {
      setTopicFilter((prev) => new Set(prev).add(t));
      setTopicInput('');
    }
  }

  function handleColumnClick(key: 'topic' | 'status' | 'due_date') {
    if (key === 'due_date' && sort === 'due_date') {
      setDueDateDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      setOpenFilterKey(null);
      return;
    }
    setSort(key);
    if (key === 'due_date') {
      setDueDateDirection('asc');
      setOpenFilterKey(null);
    } else {
      setOpenFilterKey((prev) => (prev === key ? null : key));
    }
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

  const uniqueTopics = Array.from(new Set(tasks.map((t) => t.topic))).sort();

  const filteredTasks = tasks.filter(
    (t) =>
      (statusFilter.size === 0 || statusFilter.has(t.status)) &&
      (topicFilter.size === 0 || topicFilter.has(t.topic))
  );

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

      <div className={styles.controls} ref={controlsRef}>
        <label>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {' '}Show archived
        </label>

        <span className={styles.sortLabel}>Sort by:</span>

        <div className={styles.filterGroup}>
          <button
            className={sort === 'topic' ? styles.columnButtonActive : styles.columnButton}
            onClick={() => handleColumnClick('topic')}
          >
            Topic {topicFilter.size > 0 && `(${topicFilter.size})`} ▾
          </button>
          {openFilterKey === 'topic' && (
            <div className={styles.dropdownPanel}>
              <input
                placeholder="Type a topic and press Enter"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopicFilter())}
                className={styles.topicInput}
              />
              {uniqueTopics.map((topic) => (
                <label key={topic} className={styles.dropdownRow}>
                  <input
                    type="checkbox"
                    checked={topicFilter.has(topic)}
                    onChange={() => toggleTopicFilter(topic)}
                  />
                  {topic}
                </label>
              ))}
              {topicFilter.size > 0 && (
                <button
                  className={styles.clearButton}
                  onClick={() => {
                    setTopicFilter(new Set());
                    if (sort === 'topic') setSort('due_date');
                  }}
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.filterGroup}>
          <button
            className={sort === 'status' ? styles.columnButtonActive : styles.columnButton}
            onClick={() => handleColumnClick('status')}
          >
            Status {statusFilter.size > 0 && `(${statusFilter.size})`} ▾
          </button>
          {openFilterKey === 'status' && (
            <div className={styles.dropdownPanel}>
              {(['Todo', 'In-Progress', 'Complete'] as const).map((status) => (
                <label key={status} className={styles.dropdownRow}>
                  <input
                    type="checkbox"
                    checked={statusFilter.has(status)}
                    onChange={() => toggleStatusFilter(status)}
                  />
                  {status}
                </label>
              ))}
              {statusFilter.size > 0 && (
                <button
                  className={styles.clearButton}
                  onClick={() => {
                    setStatusFilter(new Set());
                    if (sort === 'status') setSort('due_date');
                  }}
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        <button
          className={sort === 'due_date' ? styles.columnButtonActive : styles.columnButton}
          onClick={() => handleColumnClick('due_date')}
        >
          Due Date {sort === 'due_date' && (dueDateDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <ul className={styles.list}>
        {filteredTasks.map((task) => (
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
                <div className={styles.titleRow}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.titleRowRight}>
                    {isOverdue(task) && <span className={styles.badgeOverdue}>OVERDUE</span>}
                    {task.archived_at && <span className={styles.badgeArchived}>Archived</span>}
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
                </div>

                <div className={styles.topicRow}>Topic: {task.topic}</div>

                <div className={styles.dateRow}>
                  <span>Due: {task.due_date}</span>
                </div>

                <div className={styles.statusRow}>
                  <span>Status: <span className={statusBadgeClass(task.status, styles)}>{task.status}</span></span>
                </div>

                <div className={styles.description}>{task.description}</div>

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