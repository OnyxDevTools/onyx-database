# Update smoke test to use example schema

Update the smoke test to use the example schema with tables User, Role, Permission, UserProfile, etc.

## Plan
1. Replace StreamingChannel smoke test with operations on User, Role, Permission, and UserProfile tables from example schema.
2. Create a user with profile and assign a role and permission.
3. Query the user with resolved profile, roles, and permissions.
4. Delete created records.
5. Run lint, typecheck, build, and tests.
6. Add changelog entry.
7. Move plan file to finished with acceptance criteria checked off.

## Acceptance Criteria
- [x] Smoke test uses example schema tables
- [x] Test passes and verifies basic CRUD operations
