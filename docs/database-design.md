cat > docs/database-design.md << 'EOF'
# Database Design

## Schema

```sql
CREATE TABLE tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date    TEXT NOT NULL,
  topic       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Todo'
              CHECK (status IN ('Todo', 'In-Progress', 'Complete')),
  archived_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Relationships

There is a single table and no foreign keys. Topics are free-text values on each task rather than a separate normalised table, since the brief does not require topics to be managed as their own entities and a single table is sufficient for a single-user local tool.

## Design decisions

- **Archiving is a timestamp, not a delete.** `archived_at` is `NULL` for active tasks and set to the archive time otherwise. Tasks are never deleted from the table, satisfying the "archived tasks remain viewable" requirement directly — no separate archive table or soft-delete flag is needed.
- **Overdue status is derived, never stored.** Whether a task is overdue is computed at read time from `due_date`, `status`, and `archived_at` (due date has passed, status is not `Complete`, and the task is not archived). This was a deliberate choice to avoid the overdue state ever going stale relative to the due date, and to keep it clearly separate from the three fixed statuses.
- **Status is constrained at the database level** via a `CHECK` constraint, matching the requirement that the three statuses are fixed and not user-customisable.
EOF