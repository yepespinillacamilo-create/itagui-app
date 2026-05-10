export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDb } = await import('./lib/db');
    try {
      const db = getDb();
      await db.execute('SELECT 1');
    } catch {
      // silencioso — no bloquea el arranque
    }
  }
}
