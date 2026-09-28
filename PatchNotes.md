# Aura Workspace — Version 2.0 Roadmap & TODO Backlog

---

## Phase 1: Interactive Developer Codeblocks & UX
- [ ] **Syntax Highlighting & Metadata Bar**: Implement language detection badges, execution time estimates, and one-click clipboard copying.
- [ ] **Side-by-Side Diff Inspection**: Introduce unified red/green code diff visualization (`react-diff-viewer-continued`) for refactoring queries.
- [ ] **Client-Side Live Sandboxing**: Integrate browser-based execution previews (Sandpack / WebContainer) for testing frontend and Node snippets inline.

---

## Phase 2: Slash Command Productivity Engine
- [ ] **Command Parsing Gateway**: Intercept `/` tokens within the chat input to invoke specialized prompt templates.
- [ ] **`/test`**: Auto-generate automated unit and integration tests (PHPUnit, Jest, Mocha).
- [ ] **`/optimize`**: Return asymptotic time and space complexity evaluations ($O(n)$) alongside algorithmic efficiency recommendations.
- [ ] **`/refactor`**: Reorganize code structure for clean architecture and edge-case handling without changing external business logic.
- [ ] **`/explain`**: Generate step-by-step structural breakdowns of complex logic.

---

## Phase 3: Cross-Module Tool Calling (Workspace Brain)
- [ ] **Data Engine Bridge (Function Calling)**: Allow Aura Vault to inspect PostgreSQL schemas, draft migration files, and explain query execution plans.
- [ ] **API Sentinel Security Audits**: Enable chat-triggered endpoint inspection for header hygiene, latency checks, and cookie/JWT policy validation.
- [ ] **Cloud Shell Interactivity**: Connect sandbox container outputs directly into the chat session for immediate error analysis.

---

## Phase 4: Codebase Context & Knowledge Ingestion (RAG)
- [ ] **Multi-File & Archive Drag-and-Drop**: Support uploading `.zip` archives or project directories with background text extraction.
- [ ] **Vector Code Search**: Implement semantic vector retrieval via `pgvector` and Gemini embeddings (`text-embedding-004`) to query workspace controllers and configurations.
- [ ] **GitHub Integration**: Connect repository webhooks to analyze test workflow runs, CI logs, and pull request changes.

---

## Phase 5: Thread Management & Export Services
- [ ] **Full-Text Message Search**: Implement PostgreSQL full-text search (`tsvector` / `to_tsquery`) over `vault_messages.text` from the sidebar.
- [ ] **Session Exporting**: Support single-click conversation exports to formatted Markdown files (`.md`) and direct GitHub Gists.