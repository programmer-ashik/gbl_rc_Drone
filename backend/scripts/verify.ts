import 'dotenv/config';

const base = `http://127.0.0.1:${process.env.PORT || 5000}/api/v1`;

const run = async () => {
  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error(`Health check failed: ${health.status}`);
  const body = await health.json();
  if (!body.success) throw new Error('Health envelope invalid');
  console.log('verify: health OK', body.data);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
