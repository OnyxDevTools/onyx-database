# @onyx.dev/onyx-database

TypeScript client SDK for **Onyx Cloud Database** — a zero-dependency, strict-typed, builder-pattern API for querying and persisting data in Onyx from Node.js or modern bundlers. Ships ESM & CJS, includes a credential resolver, and an optional **schema code generator** that produces table-safe types and a `tables` enum.

- **Website:** <https://onyx.dev/>
- **Cloud Console:** <https://cloud.onyx.dev>
- **Docs hub:** <https://onyx.dev/documentation/>
- **Cloud API docs:** <https://onyx.dev/documentation/api-documentation/>
- **API Reference:** [./docs](./docs)
- **Quality:** 100% unit test coverage enforced in CI

---

## Getting started (Cloud ➜ keys ➜ connect)

1. **Sign up & create resources** at **<https://cloud.onyx.dev>**  
   Create an **Organization**, then a **Database**, define your **Schema** (e.g., `User`, `Role`, `Permission`), and create **API Keys**.
2. **Note your connection parameters**:  
   - `baseUrl` (e.g., `https://api.onyx.dev`)  
   - `databaseId`  
   - `apiKey`  
   - `apiSecret`  
3. **Install the SDK** in your project:

   ```bash
   npm i @onyx.dev/onyx-database
   ```

4. **Initialize the client** using env vars or a config file (details below).

> Node.js **18+** required.

---

## Install

```bash
npm i @onyx.dev/onyx-database
```

The package is dual-module (ESM + CJS) and has **no runtime dependencies**.

---

## Initialize the client

This SDK resolves credentials automatically using the chain **environment ➜ project file ➜ home profile** (highest to lowest precedence). You can also pass credentials directly to `init()`.

### Option A) Environment variables (recommended for production)

Set any of the following (NEXT_ variants work in frameworks like Next.js):

- `ONYX_DATABASE_BASE_URL` or `NEXT_ONYX_DATABASE_BASE_URL`
- `ONYX_DATABASE_ID` or `NEXT_ONYX_DATABASE_ID`
- `ONYX_DATABASE_API_KEY` or `NEXT_ONYX_DATABASE_API_KEY`
- `ONYX_DATABASE_API_SECRET` or `NEXT_ONYX_DATABASE_API_SECRET`

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init(); // resolves from env/project file/home profile
```

### Option B) Project file (checked into *your app* repo)

```json
// ./onyx-database.json
{
  "baseUrl": "https://api.onyx.dev",
  "databaseId": "YOUR_DATABASE_ID",
  "apiKey": "YOUR_KEY",
  "apiSecret": "YOUR_SECRET"
}
```

### Option C) Home profile (per-developer)

- `~/.onyx/onyx-database-<databaseId>.json`, or
- `~/.onyx/onyx-database.json` (used when only one profile exists)

### Option D) Explicit config

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init({
  baseUrl: 'https://api.onyx.dev',
  databaseId: 'YOUR_DATABASE_ID',
  apiKey: 'YOUR_KEY',
  apiSecret: 'YOUR_SECRET',
});
```

---

## Optional: generate TypeScript types from your schema

The package ships a small codegen CLI that emits per-table interfaces, a `tables` enum, and a `Schema` mapping for compile-time safety and IntelliSense.

Generate directly from the API (using the same credential resolver as `init()`):

```bash
npx onyx-gen --source api --out ./src/onyx/types.ts --name OnyxSchema --timestamps string
```

Or from a local schema file you export from the console:

```bash
npx onyx-gen --source file --schema ./onyx.schema.json --out ./src/onyx/types.ts --name OnyxSchema
```

Use in code:

```ts
import { onyx, eq, asc } from '@onyx.dev/onyx-database';
import { tables, Schema } from './src/onyx/types';

const db = onyx.init<Schema>();

const User = await db
  .from(tables.User)
  .where(eq('status', 'active'))
  .orderBy(asc('createdAt'))
  .limit(20)
  .list();
```

> The generator defaults to not emitting the JSON copy of your schema. Use `--emit-json` if you want it.

---

## Query helpers at a glance

Importable helpers for conditions and sort:

```ts
import {
  eq, neq, inOp, notIn, between,
  gt, gte, lt, lte,
  like, notLike, contains, notContains,
  startsWith, notStartsWith, matches, notMatches,
  isNull, notNull,
  asc, desc
} from '@onyx.dev/onyx-database';
```

---

## Usage examples with `User`, `Role`, `Permission`

> The examples assume your schema has tables named `User`, `Role`, and `Permission`.  
> If you generated types, replace string literals with `tables.User`, `tables.Role`, etc., and type your results with `Schema`.

### 1) List (query & paging)

```ts
import { onyx, eq, contains, asc } from '@onyx.dev/onyx-database';

const db = onyx.init();

// Fetch first 25 active User whose email contains "@example.com"
const firstPage = await db
  .from('User')
  .where(eq('status', 'active'))
  .and(contains('email', '@example.com'))
  .orderBy(asc('createdAt'))
  .limit(25)
  .page(); // or .list() to get just records

// Iterate to fetch all pages:
const allActive = await db
  .from('User')
  .where(eq('status', 'active'))
  .list();
```

### 2) Save (create/update)

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

// Upsert a single user
await db.save('User', {
  id: 'user_123',
  email: 'alice@example.com',
  status: 'active',
});

// Batch upsert User
await db.save('User', [
  { id: 'user_124', email: 'bob@example.com', status: 'active' },
  { id: 'user_125', email: 'carol@example.com', status: 'invited' },
]);

// Save with cascade relationships (example)
await db.cascade('User.Role').save('User', {
  id: 'user_126',
  email: 'dana@example.com',
  Role: ['role_admin', 'role_editor'],
});
```

### 3) Delete (by primary key)

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

// Simple delete
await db.delete('User', 'user_125');

// Delete cascading relationships (example)
await db.delete('Role', 'role_temp', { relationships: ['Role.Permission'] });
```

### 4) Documents API (binary assets)

```ts
import { onyx, type OnyxDocument } from '@onyx.dev/onyx-database';
const db = onyx.init();

// Save / upload a document (Base64 content)
const logoPng = Buffer.from('89504E47...', 'hex').toString('base64');
const doc: OnyxDocument = {
  documentId: 'logo.png',
  path: '/brand/logo.png',
  mimeType: 'image/png',
  content: logoPng,
};
await db.saveDocument(doc);

// Get a document (optionally with resizing hints if supported)
const image = await db.getDocument('logo.png', { width: 128, height: 128 });

// Delete a document
await db.deleteDocument('logo.png');
```

### 5) Streaming (live changes)

```ts
import { onyx, eq } from '@onyx.dev/onyx-database';
const db = onyx.init();

const stream = db
  .from('User')
  .where(eq('status', 'active'))
  .onItemAdded((u) => console.log('USER ADDED', u))
  .onItemUpdated((u) => console.log('USER UPDATED', u))
  .onItemDeleted((u) => console.log('USER DELETED', u))
  .onItem((entity, action) => console.log('STREAM EVENT', action, entity));

// Start the stream; include query results and keep-alive as desired:
const handle = await stream.stream(true, false);

// Later, cancel:
setTimeout(() => handle.cancel(), 60_000);
```

---

## Error handling

- **OnyxConfigError** – thrown by `init()` if required connection parameters are missing.  
- **HttpError** – thrown for non-2xx API responses, with status and message from the server.

Use standard `try/catch` or `.catch()` patterns:

```ts
try {
  const db = onyx.init();
  // ...perform queries...
} catch (err) {
  console.error('Onyx error:', err);
  // Handle configuration or HTTP errors here.
}
```

---

## Runtime & bundlers

- **ESM**: `dist/index.js`  
- **CJS**: `dist/index.cjs`  
- **Types**: `dist/index.d.ts`  

Works in Node 18+ and modern bundlers (Vite, esbuild, Webpack). For TypeScript, prefer:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true
  }
}
```
---

## Release workflow

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

1. Run `npm run changeset` to create a changeset entry.
2. Push to `main` and the **Release** workflow opens a version PR.
3. Tag the release to trigger `npm run release -- --dry-run` in CI.

---

## Related links

- Onyx website: <https://onyx.dev/>  
- Cloud console: <https://cloud.onyx.dev>  
- Docs hub: <https://onyx.dev/documentation/>  
- Cloud API docs: <https://onyx.dev/documentation/api-documentation/>

---

## Security

See [SECURITY.md](./SECURITY.md) for our security policy and vulnerability reporting process.

---

## License

Apache-2.0 © Onyx Dev Tools

---

> **Keywords:** Onyx Database TypeScript SDK, Onyx Cloud Database, Onyx NoSQL Graph Database client, TypeScript query builder, tables enum, schema code generation, zero-dependency database client, ESM CJS, Node.js database SDK, User Role Permission example
