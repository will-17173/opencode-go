import { createClient } from 'openwork/client';

const client = createClient({ baseUrl: 'http://127.0.0.1:4096' });

async function run() {
  const directory = 'C:\\Users\\Huang\\Downloads\\test';
  
  const sub = await client.event.subscribe({ directory });
  
  // listen to events in background
  (async () => {
    for await (const raw of sub.stream) {
      console.log('EVENT:', JSON.stringify(raw));
    }
    console.log('Stream ended');
  })();
  
  console.log('Subscribed. Creating session...');
  const sessionResult = await client.session.create({ directory });
  const sessionId = sessionResult.data.id;
  console.log('Session ID:', sessionId);
  
  console.log('Sending promptAsync...');
  const promptResult = await client.session.promptAsync({
    sessionID: sessionId,
    directory,
    model: { providerID: 'openai', modelID: 'kimi-k2.5' },
    parts: [{ type: 'text', text: '123' }]
  });
  console.log('promptAsync result:', promptResult);
}

run().catch(console.error);