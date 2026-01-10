// filename: examples/query/inner-query.ts
import { onyx, within, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  // Find users whose id appears in the UserRole table for an admin role.
  const usersWithAdminRole = await db
    .from(tables.User)
    .where(
      within(
        'id',
        db
          .select('userId')
          .from(tables.UserRole)
          .where(eq('roleId', 'role-admin')),
      ),
    )
    .list();

  console.log('Users with admin role:', usersWithAdminRole);

  // Find roles that reference a specific permission via RolePermission, using a sub-query
  // built with from(...) (no select fields required).
  const rolesWithPermission = await db
    .from(tables.Role)
    .where(
      within(
        'id',
        db.from(tables.RolePermission).where(eq('permissionId', 'perm-manage-users')),
      ),
    )
    .list();

  console.log('Roles containing permission perm-manage-users:', rolesWithPermission);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
