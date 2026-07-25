# DATA-STRUCTURE.md

How document JSON is represented in memory and how we plan to persist it.

## 1. In-memory shape (current)

The full document is held in `App.js` as:

```ts
type Document = { pages: Page[] };
type Page    = { page: PageMeta; elements: Element[] };
type Element = { id, type, x, y, width, height, content, style, hidden? };
```

For a 20+ page document with dozens of elements per page, the serialized JSON
realistically lands in the **1–10 MB** range (Quill HTML payloads are the
biggest contributor). That puts it above the threshold where a single DB row
gets uncomfortable.

## 2. Storage options considered

### A. JSON column in the DB (Postgres `JSONB`, MySQL `JSON`, MongoDB doc)

- **Pros**
  - Single-query read/write.
  - Transactional alongside user/permission rows.
  - Server-side queries (`WHERE doc->'pages' @> ...`).
- **Cons**
  - Bloats rows; slows backups, replication, and vacuuming.
  - Postgres TOAST kicks in around a few MB and adds latency.
  - Per-row cost in managed services (Aurora, Cloud SQL) scales with size.
  - Hard to stream into the browser; you ship the whole blob every time.

### B. Full JSON in S3 / object storage

- **Pros**
  - Cheap at any size; scales independently of the DB.
  - Natural fit for object versioning, lifecycle rules, and CDN delivery.
  - No row size ceiling.
- **Cons**
  - Two-step fetch (metadata row + object).
  - No server-side query on the document body.
  - Presigned-URL / proxy plumbing for auth.

### C. Hybrid (recommended once we go server-side)

- **DB row** holds **metadata only**:
  `id`, `owner`, `title`, `page_count`, `size_bytes`, `thumbnail_url`,
  `current_version`, `created_at`, `updated_at`, `s3_key`.
- **S3** holds the **full JSON**:
  `s3://<bucket>/templates/{id}/v{n}.json` (versioned).
- **Read path**: fetch metadata row → presigned GET for the current version.
- **Write path**: PUT new JSON to S3 (often as a new version) → update
  metadata row in the same transaction; flip `current_version` to the new
  object key.

This is the standard pattern used by Notion, Figma, Linear, and most
"document-shaped" products. It keeps the DB small and fast, makes large
documents cheap to back up, and leaves room for streaming, partial loads, and
collaborative edits later.

## 3. Current (client-side) storage

Until the server side exists, everything lives in `localStorage` under these
keys (see `src/lib/session.js` and `src/lib/history.js`):

| Key                              | Contents                                          |
| -------------------------------- | ------------------------------------------------- |
| `docugine:current`               | The active document (replaces the old `docugine:template`). |
| `docugine:history`               | The serialized undo-tree for the active document. |
| `docugine:sessions`              | Index of saved snapshots: `[{id, name, updatedAt}]`. |
| `docugine:session:{id}`          | Each saved snapshot: `{id, name, updatedAt, doc, history}`. |
| `docugine:settings`              | UI preferences (panel widths, zoom, etc.).        |

When we move to a server, the same shape maps cleanly onto the hybrid model:
- `docugine:current` → S3 current object + DB metadata row.
- `docugine:history` → server-side history API (or omitted; the server keeps
  its own audit log).
- `docugine:session:{id}` → S3 archived versions.
- `docugine:settings` → DB user-preferences row.

## 4. Migration plan (when we go server-side)

1. Add a `documents` table with the metadata columns from §2.C.
2. Add an S3 bucket + IAM role; the app gets presigned URLs from a small
   backend (or signed cookies if we proxy).
3. Replace `localStorage` reads/writes in `session.js` with `fetch` to a
   `/api/documents/...` endpoint that does the metadata + S3 dance.
4. Keep `history.js` client-side for now (instant undo/redo) but optionally
   mirror recent nodes to a server-side `document_history` table for
   cross-device undo.

## 5. Size and performance budgets

- **Single document**: aim to keep p95 < 5 MB so a `JSON.stringify` + `fetch`
  is well under a second on a typical connection.
- **History depth**: cap to `defaults.history.maxNodes` (default 200) and
  prune the oldest leaf branches first.
- **Saved sessions**: cap to `defaults.session.maxSessions` (default 10); the
  oldest is evicted on save when full.
