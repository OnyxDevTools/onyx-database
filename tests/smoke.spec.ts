import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { onyx, eq, contains, startsWith, gt } from '../src';
import { resolveConfig } from '../src/config/chain';

let hasConfig = true;
try {
  await resolveConfig();
} catch {
  hasConfig = false;
}

describe.runIf(hasConfig)('smoke e2e', () => {
  it('creates, queries, and deletes a user', async () => {
    const db = onyx.init();

    const now = new Date().toISOString();

    const role = {
      id: randomUUID(),
      name: 'smoke-role',
      description: 'role for smoke test',
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };

    const permission = {
      id: randomUUID(),
      name: 'smoke-permission',
      key: 'smoke:test',
      createdAt: now,
      updatedAt: now,
    };

    await db.save('Role', role);
    await db.save('Permission', permission);
    await db.save('RolePermission', {
      id: randomUUID(),
      roleId: role.id,
      permissionId: permission.id,
      createdAt: now,
    });

    const userId = randomUUID();
    const userData = {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      email: `user_${userId}@example.com`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      profile: {
        id: randomUUID(),
        userId,
        firstName: 'Smoke',
        lastName: 'Test',
        createdAt: now,
        updatedAt: now,
      },
      roles: [
        {
          id: randomUUID(),
          userId,
          roleId: role.id,
          createdAt: now,
        },
      ],
      permissions: [
        {
          id: randomUUID(),
          userId,
          permissionId: permission.id,
          createdAt: now,
        },
      ],
    };

    const saved = await db
      .cascade(
        'profile:UserProfile(userId, id)',
        'roles:UserRole(userId, id)',
        'permissions:UserPermission(userId, id)'
      )
      .save('User', userData);

    expect((saved as any).id).toBe(userId);

    const retrieved = await db
      .from('User')
      .where(eq('id', userId))
      .resolve('profile', 'roles', 'permissions')
      .limit(1)
      .list();

    expect(retrieved.length).toBe(1);
    const user = retrieved[0] as any;
    expect(user.profile).toBeTruthy();
    expect(user.roles?.length).toBe(1);
    expect(user.permissions?.length).toBe(1);

    const countBeforeDelete = await db
      .from('User')
      .where(eq('id', userId))
      .count();
    expect(countBeforeDelete).toBe(1);

    const searchResults = await db
      .from('User')
      .where(eq('id', userId))
      .and(eq('isActive', true))
      .and(contains('email', 'user_'))
      .and(startsWith('username', 'user_'))
      .and(gt('createdAt', '2000-01-01T00:00:00.000Z'))
      .limit(1)
      .list();

    expect(searchResults.length).toBe(1);
    expect((searchResults[0] as any).id).toBe(userId);

    await db
      .cascade('profile', 'roles', 'permissions')
      .delete('User', userId);
    await db.cascade('permissions').delete('Role', role.id);
    await db.delete('Permission', permission.id);

    const countAfterDelete = await db
      .from('User')
      .where(eq('id', userId))
      .count();

    expect(countAfterDelete).toBe(0);
  }, 30000);
});
