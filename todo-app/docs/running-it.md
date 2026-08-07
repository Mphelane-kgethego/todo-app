# Running It

## Requirements
- Node v24.18.0 (developed and tested against this version)

## Install
```bash
git clone https://github.com/Mphelane-kgethego/todo-app.git
cd todo-app
npm install
```

If you see a message about blocked install scripts for `better-sqlite3`, approve it so the native SQLite binding compiles:
```bash
npm install-scripts approve better-sqlite3
```

## Run
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Test
```bash
npm test
```
Runs the full test suite (5 tests) against a throwaway SQLite database — it does not touch your local `data/app.db`.
