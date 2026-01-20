// filename: examples/seed.ts
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onyx, type IOnyxDatabase, type SchemaUpsertRequest } from '@onyx.dev/onyx-database';
import { tables, Schema, Role, Permission, RolePermission, User, AuditLog } from './onyx/types';

const thisDir = path.dirname(fileURLToPath(import.meta.url));

async function findSchemaPath(): Promise<string> {
  const candidates = [
    process.env.ONYX_SCHEMA_PATH ? path.resolve(process.env.ONYX_SCHEMA_PATH) : undefined,
    path.resolve(thisDir, './onyx.schema.json'),
    path.resolve(thisDir, '../onyx.schema.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    `Schema file not found. Checked ${candidates.join(
      ', ',
    )}. Set ONYX_SCHEMA_PATH to point to your schema JSON.`,
  );
}

async function ensureSchema(db: IOnyxDatabase<Schema>): Promise<void> {
  const requiredTables = [
    tables.Role,
    tables.Permission,
    tables.RolePermission,
    tables.User,
    tables.UserProfile,
    tables.AuditLog,
  ];

  const hasAllTables = async (): Promise<boolean> => {
    const schema = await db.getSchema();
    const existing = new Set(schema.entities.map((e) => e.name));
    return requiredTables.every((t) => existing.has(t));
  };

  if (await hasAllTables()) return;

  const schemaPath = await findSchemaPath();
  const raw = await fs.readFile(schemaPath, 'utf8');
  const schema = JSON.parse(raw) as SchemaUpsertRequest;
  await db.updateSchema(schema, { publish: true });

  if (!(await hasAllTables())) {
    throw new Error('Required tables still missing after publishing root schema.');
  }
}

export async function seed(): Promise<User> {
  const db = onyx.init<Schema>();

  await ensureSchema(db);

  // Create Role
  const role = (await db.save(tables.Role, {
    id: randomUUID(),
    name: 'Admin',
    description: 'Administrators with full access',
    isSystem: false,
    deletedAt: null,
  })) as Role;

  // Create Permissions
  const wPermission = (await db.save(tables.Permission, {
    id: randomUUID(),
    name: 'user.write',
    description: 'Create, update, and delete users',
    deletedAt: null,
  })) as Permission;

  const rPermission = (await db.save(tables.Permission, {
    id: randomUUID(),
    name: 'user.read',
    description: 'get user(s)',
    deletedAt: null,
  })) as Permission;

  // Link RolePermissions
  await db.save(tables.RolePermission, [
    {
      id: randomUUID(),
      roleId: role.id,
      permissionId: rPermission.id,
    },
    {
      id: randomUUID(),
      roleId: role.id,
      permissionId: wPermission.id,
    },
  ] as RolePermission[]);

  // Create User
  const user = (await db.save(tables.User, {
    id: randomUUID(),
    username: 'admin-user-1',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: null,
    deletedAt: null,
  })) as User;

  // Create UserProfile
  await db.save(tables.UserProfile, {
    id: randomUUID(),
    userId: user.id,
    firstName: 'Example',
    lastName: 'Admin',
    bio: 'Seeded admin profile',
    phone: null,
    address: null,
    avatarUrl: null,
    updatedAt: null,
    deletedAt: null,
    age: 42,
  });

  // Link UserRole
  await db.save(tables.UserRole, {
    id: randomUUID(),
    userId: user.id,
    roleId: role.id,
  });

  // Return the created user
  return user;
}

export async function seedAuditLogs(): Promise<AuditLog[]> {
  const db = onyx.init<Schema>();

  const now = Date.now();
  const logs: AuditLog[] = [
    {
      id: '1',
      dateTime: new Date(now),
      action: 'CREATE',
      status: 'SUCCESS',
      actorId: 'admin-user-1',
      tenantId: 'tenant-1',
      targetId: 'entity-1',
      resource: 'User',
      requestId: 'req-1',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '2',
      dateTime: new Date(now - 60_000),
      action: 'DELETE',
      status: 'SUCCESS',
      actorId: 'admin-user-1',
      tenantId: 'tenant-1',
      targetId: 'entity-2',
      resource: 'User',
      requestId: 'req-2',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '3',
      dateTime: new Date(now - 2 * 60_000),
      action: 'LOGIN',
      status: 'SUCCESS',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-3',
      resource: 'Role',
      requestId: 'req-3',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '4',
      dateTime: new Date(now - 3 * 60_000),
      action: 'GET',
      status: 'FAILURE',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-6',
      resource: 'Role',
      requestId: 'req-4',
      errorCode: 'ERR_SAMPLE',
      errorMessage: 'Sample error',
      changes: null,
      metadata: null,
    },
    {
      id: '5',
      dateTime: new Date(now - 4 * 60_000),
      action: 'CREATE',
      status: 'SUCCESS',
      actorId: 'admin-user-1',
      tenantId: 'tenant-1',
      targetId: 'entity-5',
      resource: 'User',
      requestId: 'req-5',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '6',
      dateTime: new Date(now - 5 * 60_000),
      action: 'UPDATE',
      status: 'FAILURE',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-6',
      resource: 'User',
      requestId: 'req-6',
      errorCode: 'ERR_SAMPLE',
      errorMessage: 'Sample error',
      changes: null,
      metadata: null,
    },
    {
      id: '7',
      dateTime: new Date(now - 6 * 60_000),
      action: 'UPDATE',
      status: 'SUCCESS',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-7',
      resource: 'Role',
      requestId: 'req-7',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '8',
      dateTime: new Date(now - 7 * 60_000),
      action: 'GET',
      status: 'SUCCESS',
      actorId: 'admin-user-1',
      tenantId: 'tenant-1',
      targetId: 'entity-8',
      resource: 'User',
      requestId: 'req-8',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
    {
      id: '9',
      dateTime: new Date(now - 8 * 60_000),
      action: 'CREATE',
      status: 'FAILURE',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-9',
      resource: 'Role',
      requestId: 'req-9',
      errorCode: 'ERR_SAMPLE',
      errorMessage: 'Sample error',
      changes: null,
      metadata: null,
    },
    {
      id: '10',
      dateTime: new Date(now - 9 * 60_000),
      action: 'LOGIN',
      status: 'SUCCESS',
      actorId: 'service',
      tenantId: 'tenant-1',
      targetId: 'entity-10',
      resource: 'User',
      requestId: 'req-10',
      errorCode: null,
      errorMessage: null,
      changes: null,
      metadata: null,
    },
  ];

  return (await db.save(tables.AuditLog, logs)) as AuditLog[];
}

async function runIfInvokedDirectly(): Promise<void> {
  const executedAsScript = import.meta.url === new URL(process.argv[1] ?? '', 'file://').href;
  if (!executedAsScript) return;
  await seed();
  console.log('example: completed');
}

runIfInvokedDirectly().catch((err) => {
  console.error(err);
  process.exit(1);
});
