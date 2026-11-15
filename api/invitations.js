import { createHash, randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Database connection string is missing.');
    return res.status(500).json({ error: 'Database environment variables not configured.' });
  }

  const expectedSalt = process.env.INVITATION_TOKEN;
  if (!expectedSalt) {
    console.error('Invitation token is missing.');
    return res.status(500).json({ error: 'Token generator belum dikonfigurasi di server.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.salt !== expectedSalt) {
      return res.status(403).json({ error: 'Token generator tidak valid.' });
    }

    if (!Array.isArray(body.names) || body.names.length === 0 || body.names.length > 500) {
      return res.status(400).json({ error: 'Daftar nama tidak valid (maksimal 500 nama).' });
    }

    const names = [...new Set(body.names
      .filter(name => typeof name === 'string')
      .map(name => name.trim().replace(/\s+/g, ' ').slice(0, 60))
      .filter(Boolean))];
    if (!names.length) return res.status(400).json({ error: 'Isi minimal satu nama tamu.' });

    const invitations = names.map(name => ({
      id: createHash('md5').update(randomUUID() + expectedSalt, 'utf8').digest('hex'),
      name
    }));
    const sql = neon(connectionString);
    await sql`
      CREATE TABLE IF NOT EXISTS invited_guests (
        id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f]{32}$'),
        name VARCHAR(60) NOT NULL,
        device_id VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      INSERT INTO invited_guests (id, name)
      SELECT invitation.id, invitation.name
      FROM jsonb_to_recordset(${JSON.stringify(invitations)}::jsonb)
        AS invitation(id TEXT, name TEXT);
    `;

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error('Invitation generation API Error:', error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Format permintaan tidak valid.' });
    }
    return res.status(500).json({ error: 'Gagal menyimpan undangan.' });
  }
}
