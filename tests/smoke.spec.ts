import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { onyx, eq, contains, startsWith, gt } from '../src';
import { resolveConfig } from '../src/config/chain';

const repoRoot = path.resolve(__dirname, '..');
const exampleConfigPath = path.join(repoRoot, 'examples', 'onyx-database.json');
const exampleSchemaPath = path.join(repoRoot, 'examples', 'onyx.schema.json');

// Prefer existing env, otherwise fall back to examples config/schema if present.
if (!process.env.ONYX_CONFIG_PATH && fs.existsSync(exampleConfigPath)) {
  process.env.ONYX_CONFIG_PATH = exampleConfigPath;
}
if (!process.env.ONYX_SCHEMA_PATH && fs.existsSync(exampleSchemaPath)) {
  process.env.ONYX_SCHEMA_PATH = exampleSchemaPath;
}

const hasConfig = await resolveConfig().then(
  () => true,
  () => false,
);

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

    const retrieved = await db.from('User').where(eq('id', userId)).limit(1).list();

    expect(retrieved.length).toBe(1);
    const user = retrieved[0] as any;
    expect(user.email).toBe(userData.email);
    expect(user.username).toBe(userData.username);

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

    await db.cascade('profile', 'userRoles').delete('User', userId);

    try {
      await db.cascade('rolePermissions').delete('Role', role.id);
    } catch (err) {
      console.warn('smoke test: failed to delete role during cleanup:', err);
    }

    const countAfterDelete = await db
      .from('User')
      .where(eq('id', userId))
      .count();

    expect(countAfterDelete).toBe(0);
  }, 30000);

});
