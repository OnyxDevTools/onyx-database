import { onyx, eq, gt } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types'

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const topVodMovies = await db
    .from(tables.VodItem)
    .where(eq('streamType', 'movie'))
    .and(gt('rating', 9))
    .and(gt('year', 2022))
    .resolve('meta')
    .limit(5)
    .list();

  console.log(JSON.stringify(topVodMovies, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
