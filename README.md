# @onyx.dev/onyx-database

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [![codecov](https://codecov.io/gh/OnyxDevTools/onyx-database/branch/main/graph/badge.svg)](https://codecov.io/gh/OnyxDevTools/onyx-database) [![npm version](https://img.shields.io/npm/v/%40onyx.dev/onyx-database.svg)](https://www.npmjs.com/package/@onyx.dev/onyx-database)

TypeScript client SDK for **Onyx Cloud Database** — a zero-dependency, strict-typed, builder-pattern API for querying and persisting data in Onyx from Node.js or edge runtimes like Cloudflare Workers. Ships ESM & CJS, includes a credential resolver, and an optional **schema code generator** that produces table-safe types and a `tables` enum.

- **Website:** <https://onyx.dev/>
- **Cloud Console:** <https://cloud.onyx.dev>
- **Docs hub:** <https://onyx.dev/documentation/>
- **Cloud API docs:** <https://onyx.dev/documentation/api-documentation/>
- **API Reference:** [./docs](./docs)
- **Quality:** 100% unit test coverage enforced in CI

---

## Table of contents

- [Getting started](#getting-started-cloud--keys--connect)
- [Install](#install)
- [Initialize the client](#initialize-the-client)
- [Onyx AI (chat & models)](#onyx-ai-chat--models)
- [Generate schema types](#optional-generate-typescript-types-from-your-schema)
- [Query helpers](#query-helpers-at-a-glance)
- [Full-text search](#full-text-search-lucene)
- [Examples](#usage-examples-with-user-role-permission)
- [Error handling](#error-handling)
- [HTTP retries](#http-retries)
- [Onyx CLI](#onyx-cli)
- [Runtime & bundlers](#runtime--bundlers)
- [Release workflow](#release-workflow)
- [Related links](#related-links)
- [Security](#security)
- [License](#license)

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

4. **Initialize the client** using env vars or explicit config.

> Supports Node.js **18+** and Cloudflare Workers.

---

## Install

```bash
npm i @onyx.dev/onyx-database
```

The package is dual-module (ESM + CJS) and has **no runtime or peer dependencies**.

CLI tooling and schema codegen now live in the dedicated **Onyx CLI** repo:
<https://github.com/OnyxDevTools/onyx-cli>. Install it via the official install
script or Homebrew (macOS):

```bash
curl -fsSL https://raw.githubusercontent.com/OnyxDevTools/onyx-cli/main/scripts/install.sh | bash

# macOS (Homebrew)
brew tap OnyxDevTools/onyx-cli
brew install onyx-cli
```

---

## Initialize the client

This SDK resolves credentials automatically using the chain **explicit config ➜ environment variables ➜ `ONYX_CONFIG_PATH` file ➜ project config file ➜ home profile** _(Node.js only for file-based sources)_. Call `onyx.init({ databaseId: 'database-id' })` to target a specific database, or omit the `databaseId` to use the default. You can also pass credentials directly via config.

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
// credentials are cached for 5 minutes by default
```

### Option B) Explicit config

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init({
  baseUrl: 'https://api.onyx.dev',
  aiBaseUrl: 'https://ai.onyx.dev', // optional: override AI base path
  defaultModel: 'onyx', // optional: shorthand `db.chat()` model
  databaseId: 'YOUR_DATABASE_ID',
  apiKey: 'YOUR_KEY',
  apiSecret: 'YOUR_SECRET',
  partition: 'tenantA',
  requestLoggingEnabled: true, // logs HTTP requests
  responseLoggingEnabled: true, // logs HTTP responses
});
```

The `partition` option sets a default partition for queries, `findById`, and
deletes by primary key. Save operations use the partition field on the entity
itself. Enable `requestLoggingEnabled` to log each request and its body to the
console. Enable `responseLoggingEnabled` to log responses and bodies. Setting
the `ONYX_DEBUG=true` environment variable enables both request and response
logging even if these flags are not set. It also logs the source of resolved
credentials (explicit config, env vars, config path file, project file, or home profile).

### Option C) Node-only config files

Set `ONYX_CONFIG_PATH` to a JSON file containing your credentials. This file is checked after environment variables and before project and home files. When unset, the resolver checks for JSON files matching the `OnyxConfig` shape in the following order:

- `./onyx-database-<databaseId>.json`
- `./onyx-database.json`
- `~/.onyx/onyx-database-<databaseId>.json`
- `~/.onyx/onyx-database.json`
- `~/onyx-database.json`

These files are ignored in non-Node runtimes like Cloudflare Workers.

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
and cached for 5 minutes to avoid repeated credential lookups (override with
`ttl` or reset via `onyx.clearCacheConfig()`). Each database instance keeps a
single internal `HttpClient`. Requests use the runtime's global `fetch`, which
already reuses connections and pools them for keep‑alive. Reuse the returned
`db` for multiple operations; extra SDK‑level connection pooling generally isn't
necessary unless you create many short‑lived clients.

---

## Onyx AI (chat & models)

AI endpoints are OpenAI-compatible and use the same credentials as database calls. Use `db.ai` for chat, models, and script approvals; `db.chat()`/`db.chat('...')` remain supported as equivalent entrypoints. A shorthand `db.chat('content')` call is available and uses `config.defaultModel` (defaults to `onyx`). The AI base URL defaults to `https://ai.onyx.dev` and can be overridden with `aiBaseUrl` (or `ONYX_AI_BASE_URL`). The `databaseId` query param is optional; when omitted, the configured databaseId is used for grounding and billing.

### Chat completions

Examples: `examples/ai/chat.ts`, `examples/ai/chat-stream.ts`.

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init();

const quick = await db.chat('Reply with exactly one short greeting sentence.'); // returns first message content

const completion = await db.ai.chat({
  model: 'onyx-chat',
  messages: [{ role: 'user', content: 'Summarize last week’s traffic.' }],
});
console.log(completion.choices[0]?.message?.content);

// Override defaults (model/role/temperature/stream) in shorthand form
const custom = await db.chat('List three colors.', {
  model: 'onyx-chat',
  role: 'user',
  temperature: 0.2,
  stream: false, // set raw: true to receive full completion response instead of the first message content
});
```

Streaming works as an async iterable:

```ts
const stream = await db.ai.chat({
  model: 'onyx-chat',
  stream: true,
  messages: [{ role: 'user', content: 'Write a short onboarding checklist.' }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}
// stream.cancel() is available if you need to stop early
```

Tool calls mirror the ChatGPT TypeScript client:

```ts
const prompt = {
  model: 'onyx-chat',
  messages: [{ role: 'user', content: 'Find revenue for ACME in 2023.' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_revenue',
        description: 'Fetch revenue for a company and year',
        parameters: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            year: { type: 'number' },
          },
          required: ['company', 'year'],
        },
      },
    },
  ],
};

const first = await db.ai.chat(prompt);
const toolCall = first.choices[0]?.message?.tool_calls?.[0];

if (toolCall) {
  const toolResult = await getRevenue(JSON.parse(toolCall.function.arguments)); // your impl
  const followup = await db.ai.chat({
    model: prompt.model,
    messages: [
      ...prompt.messages,
      first.choices[0].message,
      { role: 'tool', tool_call_id: toolCall.id ?? '', content: JSON.stringify(toolResult) },
    ],
  });
  console.log(followup.choices[0]?.message?.content);
}
```

### Model metadata

Example: `examples/ai/models.ts`.

```ts
const models = await db.ai.getModels();
const chatModel = await db.ai.getModel('onyx-chat');
```

### Script mutation approvals

```ts
const approval = await db.ai.requestScriptApproval({
  script: "db.save({ id: 'u1', email: 'a@b.com' })",
});
if (approval.requiresApproval) {
  console.log(`Requires approval until ${approval.expiresAtIso}`);
}
```

---

## Optional: generate TypeScript types from your schema

Use the **Onyx CLI** (`onyx`) from <https://github.com/OnyxDevTools/onyx-cli> to
emit per-table interfaces, a `tables` enum, and a `Schema` mapping for
compile-time safety and IntelliSense. Each generated interface also includes an
index signature so extra properties (for graph attachments in cascade saves)
don't trigger type errors.

Generate directly from the API (using the same credential resolver as `init()`):

```bash
onyx gen --ts --source api --out ./src/onyx/types.ts --name OnyxSchema
```

With `--source api`, `onyx gen` calls the Schema API (same as `onyx schema get`) using the
standard config chain (env, project file, home profile).

Timestamp attributes are emitted as `Date` fields by default. When saving,
`Date` values are automatically serialized to ISO timestamp strings. Pass
`--timestamps string` to keep timestamps as ISO strings in generated types.

Or from a local schema file you export from the console:

```bash
onyx gen --ts --source file --schema ./onyx.schema.json --out ./src/onyx/types.ts --name OnyxSchema
```

Run it with no flags to use the defaults: `onyx gen` reads `./onyx.schema.json` and writes to `./onyx/types.ts`.

### Manage schemas from the CLI

Publish or download schema JSON directly via API using the `onyx schema` helper:

```bash
# Publish ./onyx.schema.json with publish=true by default
onyx schema publish

# Overwrite ./onyx.schema.json with the remote schema
onyx schema get

# Print the remote schema without writing a file
onyx schema get --print

# Fetch only selected tables (prints to stdout; does not overwrite files)
onyx schema get --tables=User,Profile

# Example subset output
onyx schema get --tables=User,Profile
# {
#   "tables": [
#     {
#       "name": "User",
#       "attributes": [
#         { "name": "id", "type": "string", "required": true },
#         { "name": "email", "type": "string", "required": true }
#       ]
#     },
#     {
#       "name": "Profile",
#       "attributes": [
#         { "name": "id", "type": "string", "required": true },
#         { "name": "userId", "type": "string", "required": true }
#       ]
#     }
#   ]
# }

# Validate a schema file without publishing
onyx schema validate ./onyx.schema.json

# Diff local schema vs API
onyx schema diff ./onyx.schema.json
# Prints YAML with added/removed/changed tables and attribute differences between the API schema and your local file.
```

When `--tables` is provided, the subset is printed to stdout instead of writing a
file. Otherwise, the CLI writes to `./onyx.schema.json` by default.

In this repo's `examples/` workspace, the following scripts wrap the same commands:

```bash
npm run schema:get       # fetch remote schema into ./onyx.schema.json
npm run schema:validate  # validate the local schema file
npm run schema:publish   # validate then publish the local schema
```

The CLI reuses the same configuration resolution as `onyx.init()` (env vars,
project config, and home profile files).

Programmatic diffing is also available:

```ts
import { onyx } from '@onyx.dev/onyx-database';

const db = onyx.init();
const diff = await db.diffSchema(localSchema); // SchemaUpsertRequest
console.log(diff.changedTables);
```

You can also emit to multiple paths in one run (comma-separated or by repeating `--out`):

```bash
onyx gen --ts --out ./src/onyx/types.ts,./apps/admin/src/onyx/types.ts
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
`onyx gen` emits plain interfaces keyed by IDs. Each interface includes an
index signature so resolver-attached fields or embedded objects remain
type-safe:

```ts
// AUTO-GENERATED BY onyx gen. DO NOT EDIT.
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
  eq, neq, within, notWithin, // preferred aliases for IN/NOT IN
  inOp, notIn,           
  between,
  gt, gte, lt, lte,
  like, notLike, contains, notContains,
  startsWith, notStartsWith, matches, notMatches, search,
  isNull, notNull,
  asc, desc
} from '@onyx.dev/onyx-database';
```

- Prefer `within`/`notWithin` for inclusion checks (supports arrays, comma-separated strings, or inner queries).  
- `inOp`/`notIn` remain available for backward compatibility and are exact aliases.
- `search(text, minScore?)` builds a Lucene `MATCHES` predicate on `__full_text__` and always serializes `minScore` (null when omitted).

### Aggregate helpers

```ts
import {
  avg, sum, count, min, max,
  std, variance, median,
  upper, lower,
  substring, replace, percentile,
  format
} from '@onyx.dev/onyx-database';

const rows = await db
  .select(format('createdAt', 'yyyy-MM-dd'))
  .from('User')
  .list();
```

- `format(field, formatter)` uses Java-style format strings for dates and numbers.
- Example: `examples/query/format.ts`

### Inner queries (IN/NOT IN with sub-selects)

You can pass another query builder to `within` or `notWithin` to create nested filters. The SDK serializes the inner query (including its table) before sending the request.

```ts
import { onyx, within, notWithin, eq, tables, Schema } from '@onyx.dev/onyx-database';

const db = onyx.init<Schema>();

// Users that HAVE the admin role
const usersWithAdmin = await db
  .from(tables.User)
  .where(
    within(
      'id',
      db.select('userId').from(tables.UserRole).where(eq('roleId', 'role-admin')),
    ),
  )
  .list();

// Roles that DO NOT include a specific permission
const rolesMissingPermission = await db
  .from(tables.Role)
  .where(
    notWithin(
      'id',
      db.from(tables.RolePermission).where(eq('permissionId', 'perm-manage-users')),
    ),
  )
  .list();
```

---

## Full-text search (Lucene)

Use `.search(text, minScore?)` on a query builder for table-level full-text search, or call `db.search(...)` to target **all** tables (`table = "ALL"` in the request body). The search value always includes `minScore` and falls back to `null` when you omit it.

```ts
import { desc, eq, onyx, search, tables, type Schema } from '@onyx.dev/onyx-database';

const db = onyx.init<Schema>();

// Table-specific search with a minimum score
const recentUsers = await db
  .from(tables.User)
  .search('user bio text', 4.4)
  .orderBy(desc('createdAt'))
  .limit(5)
  .list();

// Search across all tables (table: "ALL")
const acrossTables = await db.search('user bio text').list({ pageSize: 5 });

// Combine a search predicate with other filters
const activeMatch = await db
  .from(tables.User)
  .where(search('user bio text'))
  .and(eq('isActive', true))
  .firstOrNull();
```

**Examples**
- Table search (minScore null): `examples/query/lucine-table-search.ts`
- Table search (minScore 4.4): `examples/query/lucine-table-search-min-score.ts`
- ALL tables search (minScore null): `examples/query/lucine-search-all-tables.ts`
- ALL tables search (minScore 4.4): `examples/query/lucine-search-all-tables-min-score.ts`

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

// Collect IDs across all pages
const ids = await db.from('User').list().values('id');
// Get the first user across pages
const firstUser = await db.from('User').list().firstOrNull();
// Call any QueryResults helper before awaiting
const size = await db.from('User').list().size();
```

### 1b) First or null

```ts
const maybeUser = await db
  .from('User')
  .where(eq('email', 'alice@example.com')) // avoid searching by indentifier with firstOrNull, it will throw not found error
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

// Save many users in batches of 500
await db.batchSave('User', largeUserArray, 500);

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

await db.cascade(permissionsCascade).save('Role', {
  id: 'role_editor',
  name: 'Editor',
  permissions: [permission],
});
```

### 3) Delete (by primary key)

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

### 4) Delete using query

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

const delCount = await db
  .from(tables.User)
  .where(eq('status', 'inactive'))
  .delete();
//this will delete all inactive users in the system

```

### 5) Schema API

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

// Fetch current schema (optionally filter by tables)
const schema = await db.getSchema({ tables: ['User', 'Profile'] });

// Review history
const history = await db.getSchemaHistory();

// Validate changes without applying
await db.validateSchema({
  revisionDescription: 'Add profile triggers',
  entities: [
    {
      name: 'Profile',
      identifier: { name: 'id', generator: 'UUID' },
      attributes: [
        { name: 'id', type: 'String', isNullable: false },
        { name: 'userId', type: 'String', isNullable: false },
      ],
    },
  ],
});

// Update and optionally publish
await db.updateSchema(
  {
    revisionDescription: 'Publish profile changes',
    entities: [
      {
        name: 'Profile',
        identifier: { name: 'id', generator: 'UUID' },
        attributes: [
          { name: 'id', type: 'String', isNullable: false },
          { name: 'userId', type: 'String', isNullable: false },
        ],
      },
    ],
  },
  { publish: true },
);
```

### 6) Secrets API

```ts
import { onyx } from '@onyx.dev/onyx-database';
const db = onyx.init();

// List secret metadata
const list = await db.listSecrets();

// Read a decrypted secret value
const secret = await db.getSecret('api-key');

// Create or update a secret
await db.putSecret('api-key', {
  value: 'super-secret',
  purpose: 'Access to external API',
});

// Delete a secret
await db.deleteSecret('api-key');
```

### 7) Documents API (binary assets)

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

### 8) Streaming (live changes)

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

> **Debugging**: set `ONYX_STREAM_DEBUG=1` to log stream connection details.

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

## HTTP retries

- GET requests retry automatically with Fibonacci backoff (300ms base) up to 3 times by default; mutations are never retried.
- Disable or tune via `retry` on `onyx.init`:

```ts
const db = onyx.init({
  retry: {
    enabled: true,     // default
    maxRetries: 2,     // default 3
    initialDelayMs: 500, // default 300
  },
});
```

## Onyx CLI


```
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| Command              | Flags                                         | Defaults / notes                                             |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx gen             | --ts/--typescript                             | Default: --source file; --schema ./onyx.schema.json;         |
|                      | --source auto|api|file                        | --out ./onyx/types.ts (file or dir; repeatable);             |
|                      | --schema <path>                               | schema type name: OnyxSchema; timestamps default: date.      |
|                      | --out <dir|file>                              | Use --overwrite to force output; quiet=false.                |
|                      | --name <T>                                    |                                                              |
|                      | --timestamps string|date|number               |                                                              |
|                      | --overwrite / --no-overwrite                  |                                                              |
|                      | -q / --quiet                                  |                                                              |
|                      | -h / --help                                   |                                                              |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx schema get      | [file] (positional)                           | Default file: ./onyx.schema.json; writes file unless         |
|                      | --tables a,b                                  | --tables or --print (then prints to stdout).                 |
|                      | --print                                       |                                                              |
|                      | -h / --help                                   |                                                              |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx schema publish  | [file] (positional)                           | Default file: ./onyx.schema.json; validates before publishing; |
|                      | -h / --help                                   | uses onyx.init credential resolver.                          |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx schema validate | [file] (positional)                           | Default file: ./onyx.schema.json; exits non-zero on errors.  |
|                      | -h / --help                                   |                                                              |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx schema diff     | [file] (positional)                           | Default file: ./onyx.schema.json; prints YAML diff vs API.   |
|                      | -h / --help                                   |                                                              |
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
| onyx schema info     | -h / --help                                   | Shows resolved config sources, config path, connection check.|
+----------------------+-----------------------------------------------+--------------------------------------------------------------+
```

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

MIT © Onyx Dev Tools. See [LICENSE](./LICENSE).

---

> **Keywords:** Onyx Database TypeScript SDK, Onyx Cloud Database, Onyx NoSQL Graph Database client, TypeScript query builder, tables enum, schema code generation, zero-dependency database client, ESM CJS, Node.js database SDK, User Role Permission example
