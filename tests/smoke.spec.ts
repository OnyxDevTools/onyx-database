import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { onyx, eq, contains, startsWith, gt } from '../src';
import { resolveConfig } from '../src/config/chain';

const hasConfig = await resolveConfig()

describe.runIf(hasConfig)('smoke e2e', () => {
  it('creates, queries, and deletes a user', async () => {

    const db = onyx.init();
    const now = new Date()
    const startDateTime = now.toISOString();
    const fiveSecondsAgo = new Date(now.getMilliseconds() - 5000)

    const role = {
      id: randomUUID(),
      name: 'smoke-role',
      description: 'role for smoke test',
      isSystem: false,
      createdAt: startDateTime,
      updatedAt: startDateTime,
    };

    const permission = {
      id: randomUUID(),
      name: 'smoke-permission',
      key: 'smoke:test',
      createdAt: startDateTime,
      updatedAt: startDateTime,
    };

    await db.save('Role', role);
    await db.save('Permission', permission);
    await db.save('RolePermission', {
      id: randomUUID(),
      roleId: role.id,
      permissionId: permission.id,
      createdAt: startDateTime,
    });

    const userId = randomUUID();
    const userData = {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      email: `user_${userId}@example.com`,
      isActive: true,
      createdAt: startDateTime,
      updatedAt: startDateTime,
      profile: {
        id: randomUUID(),
        userId,
        firstName: 'Smoke',
        lastName: 'Test',
        createdAt: startDateTime,
        updatedAt: startDateTime,
      },
      roles: [
        {
          id: randomUUID(),
          userId,
          roleId: role.id,
          createdAt: startDateTime
        }
      ],

    };

    const saved = await db
      .cascade(
        'profile:UserProfile(userId, id)',
        'roles:UserRole(userId, id)'
      )
      .save('User', userData);

    expect((saved as any).id).toBe(userId);

    const retrieved = await db
      .from('User')
      .where(eq('id', userId))
      .resolve(['profile', 'roles.permissions'])
      .limit(1)
      .list();

    expect(retrieved.length).toBe(1);
    const user = retrieved[0] as any;
    expect(user.profile).toBeTruthy();
    expect(user.roles?.length).toBe(1);
    expect(user.roles[0].permissions?.length).toBe(1);
    expect(user.roles[0].permissions[0]).toBeTruthy();

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
      .and(gt('createdAt', fiveSecondsAgo))
      .limit(1)
      .list();

    expect(searchResults.length).toBe(1);
    expect((searchResults[0] as any).id).toBe(userId);

    await db
      .cascade('profile', 'userRoles')
      .delete('User', userId);

    await db.cascade('rolePermissions').delete('Role', role.id);

    const countAfterDelete = await db
      .from('User')
      .where(eq('id', userId))
      .count();

    expect(countAfterDelete).toBe(0);
  }, 30000);

});
