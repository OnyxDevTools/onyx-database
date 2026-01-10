// filename: examples/query/not-inner-query.ts
import { onyx, notWithin, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  // Users that do NOT have the admin role
  const usersWithoutAdmin = await db
    .from(tables.User)
    .where(
      notWithin(
        'id',
        db
          .select('userId')
          .from(tables.UserRole)
          .where(eq('roleId', 'smoke-role')),
      ),
    )
    .list();

  console.log('Users without admin role:', usersWithoutAdmin);

  // Roles that do NOT include a specific permission
  const rolesMissingPermission = await db
    .from(tables.Role)
    .where(
      notWithin(
        'id',
        db.from(tables.RolePermission).where(eq('permissionId', 'smoke-permission')),
      ),
    )
    .list();

  console.log('Roles missing perm-manage-users:', rolesMissingPermission);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
