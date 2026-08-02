cat > docs/third-party-code.md << 'EOF'
# Third-Party Code

- **next** — the application framework. Provides the App Router, API route handlers, and dev/build tooling in one package, avoiding the need to hand-roll routing or a server.
- **react** — required by Next.js as the UI rendering layer.
- **better-sqlite3** — synchronous SQLite driver. Chosen over an async driver because this is a single-user local app with no concurrent access to coordinate; synchronous calls keep the API route handlers simple with no extra async complexity.
- **vitest** — test runner. Chosen for fast startup and native TypeScript/ESM support without extra configuration, and integrates cleanly with a Next.js/TypeScript project.
EOF