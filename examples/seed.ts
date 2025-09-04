// filename: examples/seed.ts
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema, Role, Permission, RolePermission, User, UserProfile, UserRole } from './onyx/types';

export async function seed(): Promise<void> {
  const db = onyx.init<Schema>();

  // Create Role
  const role = (await db.save(tables.Role, {
    name: 'Admin',
    description: 'Administrators with full access',
    isSystem: false,
    deletedAt: null,
  })) as Role;

  // Create Permission
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

  // Link RolePermission
  await db.save(tables.RolePermission, [{
    roleId: role.id,
    permissionId: rPermission.id,
  },
  {
    roleId: role.id,
    permissionId: wPermission.id,
  }] as RolePermission[]);

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
}
