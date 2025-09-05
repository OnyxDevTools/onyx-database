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
