// filename: examples/save/cascade.ts
import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { Schema, tables, StreamingProgram, StreamingChannel } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const program: StreamingProgram  = {
    start: new Date().toISOString(),
    title: "This is a test",
    desc: "Program Description",
    icon: "http://example.com/dne.png",
    streamURL: "http://example.com/dne"
  }

  const newChannel:StreamingChannel = await db
    .cascade('programs:StreamingProgram(channelId, id)')
    .save(tables.StreamingChannel, {
      id: 'news_003',
      category: 'news',
      name: 'News 24',
      updatedAt: new Date().toISOString(),
      programs: [program]
  }) as StreamingChannel;

  console.log('Saved channel:', newChannel);

  const channels = await db
    .from(tables.StreamingChannel)
    .where(eq("id", newChannel.id))
    .resolve('programs')
    .limit(1)
    .list();

  console.log('channel with programs:', JSON.stringify(channels, null, 2));


  //cleanup
  await db.cascade('programs').delete(tables.StreamingChannel, newChannel.id!)
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
