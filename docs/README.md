**@onyx.dev/onyx-database**

***

# @onyx.dev/onyx-database

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [![codecov](https://codecov.io/gh/OnyxDevTools/onyx-database/branch/main/graph/badge.svg)](https://codecov.io/gh/OnyxDevTools/onyx-database)

TypeScript client SDK for **Onyx Cloud Database** — a zero-dependency, strict-typed, builder-pattern API for querying and persisting data in Onyx from Node.js or modern bundlers. Ships ESM & CJS, includes a credential resolver, and an optional **schema code generator** that produces table-safe types and a `tables` enum.

- **Website:** <https://onyx.dev/>
- **Cloud Console:** <https://cloud.onyx.dev>
- **Docs hub:** <https://onyx.dev/documentation/>
- **Cloud API docs:** <https://onyx.dev/documentation/api-documentation/>
- **API Reference:** [./docs](_media/docs)
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

The package is dual-module (ESM + CJS) and has **no runtime or peer dependencies**.

---

## Initialize the client

This SDK resolves credentials automatically using the chain **explicit config ➜ environment variables ➜ `ONYX_CONFIG_PATH` file ➜ project file ➜ home profile** (highest to lowest precedence). Call `onyx.init({ databaseId: 'database-id' })` to target a specific database, or omit the `databaseId` to use the default. You can also pass credentials directly via config.

### Option A) Environment variables (recommended for production)

Set the following environment variables for your database:

- `ONYX_DATABASE_ID`
- `ONYX_DATABASE_BASE_URL`
- `ONYX_DATABASE_API_KEY`
- `ONYX_DATABASE_API_SECRET`
- `ONYX_AI_BASE_URL` (optional; defaults to `https://ai.onyx.dev`)
- `ONYX_DEFAULT_MODEL` (optional; used by `db.chat('...')`, defaults to `onyx`)

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init({ databaseId: 'YOUR_DATABASE_ID' }); // uses env when ID matches
```

### Option B) Config file via `ONYX_CONFIG_PATH`

Set `ONYX_CONFIG_PATH` to a relative or absolute path to a JSON file containing your `baseUrl`, `databaseId`, `apiKey`, and `apiSecret`. The resolver loads this file after environment variables. If any values are missing, project and home files are checked as fallbacks.

### Option C) Project file (checked into *your app* repo)

```json
// ./onyx-database-YOUR_DATABASE_ID.json
{
  "baseUrl": "https://api.onyx.dev",
  "databaseId": "YOUR_DATABASE_ID",
  "apiKey": "YOUR_KEY",
  "apiSecret": "YOUR_SECRET"
}
```

### Option D) Home profile (per-developer)

- `~/.onyx/onyx-database-<databaseId>.json`, or
- `~/.onyx/onyx-database.json` (used when only one profile exists)

### Option E) Explicit config

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init({
  baseUrl: 'https://api.onyx.dev',
  aiBaseUrl: 'https://ai.onyx.dev', // optional: override AI base path
  defaultModel: 'onyx', // optional: shorthand `db.chat()` model
  databaseId: 'YOUR_DATABASE_ID',
  apiKey: 'YOUR_KEY',
  apiSecret: 'YOUR_SECRET',
});
```

### Edge / RSC usage (Next.js, Cloudflare Workers)

For edge runtimes (Next.js Edge/RSC, Cloudflare Workers), import the edge entry. It avoids Node-only imports and only resolves credentials from environment variables or explicit config.

```ts
import { onyx } from '@onyx.dev/onyx-database/edge';

const db = onyx.init(); // uses env vars in edge runtimes
```

File-based config (`ONYX_CONFIG_PATH`, project files, home profiles) is not available in edge runtimes. If you need file-based config, use the Node entry instead.

**Cloudflare Worker example:**

```ts
import { onyx } from '@onyx.dev/onyx-database/edge';

export default {
  async fetch(_request: Request, env: Record<string, string>) {
    const db = onyx.init({
      baseUrl: env.ONYX_DATABASE_BASE_URL,
      databaseId: env.ONYX_DATABASE_ID,
      apiKey: env.ONYX_DATABASE_API_KEY,
      apiSecret: env.ONYX_DATABASE_API_SECRET,
    });

    return Response.json({ ok: true });
  },
};
```

### Connection handling

Calling `onyx.init()` returns a lightweight client. Configuration is resolved once
and each database instance keeps a single internal `HttpClient`. Requests go
through Node's built‑in `fetch`, which already reuses connections and pools them
for keep‑alive. Reuse the returned `db` for multiple operations; extra SDK‑level
connection pooling generally isn't necessary unless you create many short‑lived
clients.

---

## Onyx AI (chat, models, approvals)

AI endpoints are OpenAI-compatible and share the same credentials as database calls. Use `db.ai` for chat, models, and script approvals; `db.chat()`/`db.chat('...')` are equivalent entrypoints. The shorthand `db.chat('content')` uses `defaultModel` (defaults to `onyx`; override via config or `ONYX_DEFAULT_MODEL`).

```ts
const db = onyx.init();

const quick = await db.chat('Reply with exactly one short greeting sentence.'); // returns first message content

const completion = await db.ai.chat({
  model: 'onyx-chat',
  messages: [{ role: 'user', content: 'Summarize last week.' }],
});

const custom = await db.chat('List three colors.', {
  model: 'onyx-chat',
  role: 'user',
  temperature: 0.2,
  stream: false, // set raw: true to receive full completion response instead of the first message content
});

const models = await db.ai.getModels();
const approval = await db.ai.requestScriptApproval({
  script: "db.save({ id: 'u1', email: 'a@b.com' })",
});
```

---

## Optional: generate TypeScript types from your schema

The package ships a small codegen CLI that emits per-table interfaces, a `tables` enum, and a `Schema` mapping for compile-time safety and IntelliSense. Each generated interface also includes an index signature so extra properties (for graph attachments in cascade saves) don't trigger type errors.

Generate directly from the API (using the same credential resolver as `init()`):

```bash
npx onyx-gen --source api --out ./src/onyx/types.ts --name OnyxSchema
```

Timestamp attributes are emitted as `Date` fields by default. When saving,
`Date` values are automatically serialized to ISO timestamp strings. Pass
`--timestamps string` to keep timestamps as ISO strings in generated types.

Or from a local schema file you export from the console:

```bash
npx onyx-gen --source file --schema ./onyx.schema.json --out ./src/onyx/types.ts --name OnyxSchema
```

Run it with no flags to use the defaults: `onyx-gen` reads `./onyx.schema.json` and writes to `./onyx/types.ts`.

You can also emit to multiple paths in one run (comma-separated or by repeating `--out`):

```bash
onyx-gen --out ./src/onyx/types.ts,./apps/admin/src/onyx/types.ts
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

For a schema with `User`, `UserProfile`, `Role`, and `Permission` tables,
`onyx-gen` outputs plain interfaces keyed by IDs. The index signature allows
resolver fields and embedded objects without type errors:

```ts
// AUTO-GENERATED BY onyx-gen. DO NOT EDIT.
export interface User {
  id?: string;
  name: string;
  [key: string]: any;
}

export interface Role {
  id?: string;
  title: "",
  [key: string]: any;
}

export interface Permission {
  id?: string;
  description: string;
  [key: string]: any;
}

export interface UserProfile {
  id?: string;
  age: number;
  [key: string]: any;
  createdDate: Date;
}

const user = await db
  .from(tables.User)
  .select('id', 'username')
  .resolve('roles.permissions', 'profile')
  .firstOrNull();

// user.roles -> Role[]
// user.roles[0]?.permissions -> Permission[]
// user.profile -> UserProfile | undefined
```

> The generator defaults to not emitting the JSON copy of your schema. Use `--emit-json` if you want it.

### Modeling users, roles, and permissions

`User` and `Role` form a many-to-many relationship through a `UserRole` join table. `Role` and `Permission` are connected the same way via `RolePermission`.

- **`userRoles` / `rolePermissions` resolvers** return join-table rows. Use these when cascading saves or deletes to add or remove associations.
- **`roles` / `permissions` resolvers** traverse those joins and return `Role` or `Permission` records for display.

Define these resolvers in your `onyx.schema.json`:

```json
"resolvers": [
  {
    "name": "roles",
    "resolver": "db.from(\"Role\")\n  .where(\n    inOp(\"id\", \n        db.from(\"UserRole\")\n            .where(eq(\"userId\", this.id))\n            .list()\n            .values('roleId')\n    )\n)\n .list()"
  },
  {
    "name": "profile",
    "resolver": "db.from(\"UserProfile\")\n .where(eq(\"userId\", this.id))\n .firstOrNull()"
  },
  {
    "name": "userRoles",
    "resolver": "db.from(\"UserRole\")\n  .where(eq(\"userId\", this.id))\n  .list()"
  }
]
```

Save a user and attach roles in one operation:

```ts
await db.cascade('userRoles:UserRole(userId, id)').save('User', {
  id: 'user_126',
  email: 'dana@example.com',
  userRoles: [
    { roleId: 'role_admin' },
    { roleId: 'role_editor' },
  ],
});
```

Fetch a user with roles and each role's permissions:

```ts
const detailed = await db
  .from('User')
  .resolve('roles.permissions', 'profile')
  .firstOrNull();

// detailed.roles -> Role[]
// detailed.roles[0]?.permissions -> Permission[]
```

Remove a role and its permission links:

```ts
await db.cascade('rolePermissions').delete('Role', 'role_temp');
```

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
  .page(); // or .list() for array-like results with nextPage

// Iterate to fetch all pages:
const allActive = await db
  .from('User')
  .where(eq('status', 'active'))
  .list();
```

### 1b) First or null

```ts
const maybeUser = await db
  .from('User')
  .where(eq('email', 'alice@example.com'))
  .firstOrNull(); // or .one()
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
await db.cascade('userRoles:UserRole(userId, id)').save('User', {
  id: 'user_126',
  email: 'dana@example.com',
  userRoles: [
    { roleId: 'role_admin' },
    { roleId: 'role_editor' },
  ],
});

// Cascade relationship syntax:
// field:Type(target, source)
//   field  – property or path relative to the entity being saved
//   Type   – related table name
//   target – foreign key on the related table
//   source – field on the top level entity used as the key

// Using the CascadeRelationshipBuilder
const permission = { id: 'perm_edit_content', description: 'Edit content' };
const permissionsCascade = db
  .cascadeBuilder()
  .graph('permissions')
  .graphType('Permission')
  .targetField('roleId')
  .sourceField('id');

//permissionsCascade = 'permissions:Permission(roleId, id)'

await db.cascade(permissionsCascade).save('Role', {
  id: 'role_editor',
  name: 'Editor',
  permissions: [permission],
});

//you dont have to use the cascadeBuilder
await db.cascade('permissions:Permission(roleId, id)').save('Role', {
  id: 'role_editor',
  name: 'Editor',
  permissions: [permission],
});
```

### 3) Update existing rows

```ts
import { onyx, eq } from '@onyx.dev/onyx-database';

const db = onyx.init();

const updatedCount = await db
  .from('User')
  .where(eq('id', 'user_123'))
  .setUpdates({ status: 'inactive' })
  .update();

console.log(`Updated ${updatedCount} record(s).`);
```

`.update()` returns the number of rows that were modified. Call `.setUpdates()`
before `.update()` to provide the fields you want to change.

A runnable version of this snippet lives at
[`examples/query/update.ts`](../examples/query/update.ts).

### 4) Delete (by primary key)

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

// Simple delete returns the removed record
await db.delete('User', 'user_125');

// Delete cascading relationships (example)
await db.delete('Role', 'role_temp', { relationships: ['rolePermissions'] });
// this will delete all of the related permissions that come back from the rolePermissions resolver
// builder pattern equivalent
await db.cascade('rolePermissions').delete('Role', 'role_temp');
```

### 5) Delete using query

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

const delCount = await db
  .from(tables.User)
  .where(eq('status', 'inactive'))
  .delete();
//this will delete all inactive users in the system

```

### 6) Documents API (binary assets)

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

### 6) Streaming (live changes)

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

// Start the stream and keep the connection alive for new events:
const handle = await stream.stream(true, true);

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

See [SECURITY.md](_media/SECURITY.md) for our security policy and vulnerability reporting process.

---

## License

MIT © Onyx Dev Tools. See [LICENSE](_media/LICENSE).

---

> **Keywords:** Onyx Database TypeScript SDK, Onyx Cloud Database, Onyx NoSQL Graph Database client, TypeScript query builder, tables enum, schema code generation, zero-dependency database client, ESM CJS, Node.js database SDK, User Role Permission example
