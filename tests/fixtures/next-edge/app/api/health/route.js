import { onyx } from '@onyx.dev/onyx-database/edge';

export async function GET() {
  const db = onyx.init();
  void db;
  return Response.json({ ok: true });
}
