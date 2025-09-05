// filename: examples/seed.ts
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema, Role, Permission, RolePermission, User, AuditLog } from './onyx/types';

export async function seed(): Promise<User> {
  const db = onyx.init<Schema>();

  // Create Role
  const role = (await db.save(tables.Role, {
    name: 'Admin',
    description: 'Administrators with full access',
    isSystem: false,
    deletedAt: null,
  })) as Role;

  // Create Permissions
  const wPermission = (await db.save(tables.Permission, {
    name: 'user.write',
    description: 'Create, update, and delete users',
    deletedAt: null,
  })) as Permission;

  const rPermission = (await db.save(tables.Permission, {
    name: 'user.read',
    description: 'get user(s)',
    deletedAt: null,
  })) as Permission;

  // Link RolePermissions
  await db.save(tables.RolePermission, [
    {
      roleId: role.id,
      permissionId: rPermission.id,
    },
    {
      roleId: role.id,
      permissionId: wPermission.id,
    },
  ] as RolePermission[]);

  // Create User
  const user = (await db.save(tables.User, {
    username: 'admin-user-1',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: null,
    deletedAt: null,
  })) as User;

  // Create UserProfile
  await db.save(tables.UserProfile, {
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
    userId: user.id,
    roleId: role.id,
  });

  // Return the created user
  return user;
}

export async function seedAuditLogs(): Promise<AuditLog[]> {
  const db = onyx.init<Schema>();

  const actions = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE'];

  const logs: AuditLog[] = Array.from({ length: 10 }, (_, i) => ({
    dateTime: new Date(Date.now() - i * 60000),
    action: actions[i % actions.length],
    status: i % 3 === 0 ? 'FAILURE' : 'SUCCESS',
    actorId: i % 2 === 0 ? 'admin-user-1' : 'service',
    tenantId: 'tenant-1',
    targetId: `entity-${i}`,
    resource: i % 2 === 0 ? 'User' : 'Role',
    requestId: `req-${i}`,
    errorCode: i % 3 === 0 ? 'ERR_SAMPLE' : null,
    errorMessage: i % 3 === 0 ? 'Sample error' : null,
    changes: null,
    metadata: null,
  }));

  return (await db.save(tables.AuditLog, logs)) as AuditLog[];
}
