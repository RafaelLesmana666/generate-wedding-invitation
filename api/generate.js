import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createInvitationToken, getInvitationKey } from '../lib/invitation-token.mjs';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const expectedSecret = process.env.INVITATION_GENERATOR_SECRET;
  if (!expectedSecret) {
    console.error('INVITATION_GENERATOR_SECRET environment variable is missing.');
    return res.status(500).json({ error: 'Generator is not configured.' });
  }

  let encryptionKey;
  try {
    encryptionKey = getInvitationKey();
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Invitation encryption is not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid request body.' });
    }
  }

  const secret = body && typeof body.secret === 'string' ? body.secret : '';
  const submittedSecret = Buffer.from(secret);
  const configuredSecret = Buffer.from(expectedSecret);
  if (
    submittedSecret.length !== configuredSecret.length
    || !timingSafeEqual(submittedSecret, configuredSecret)
  ) {
    return res.status(401).json({ error: 'Kunci generator salah.' });
  }

  let baseUrl;
  try {
    baseUrl = new URL(body.baseUrl);
  } catch {
    return res.status(400).json({ error: 'Alamat undangan tidak valid.' });
  }
  if (!['https:', 'http:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    return res.status(400).json({ error: 'Alamat undangan tidak valid.' });
  }

  const names = body && Array.isArray(body.names) ? body.names : [];
  if (
    names.length === 0
    || names.length > 500
    || names.some(name => typeof name !== 'string' || !name.trim() || name.trim().length > 60)
  ) {
    return res.status(400).json({ error: 'Daftar nama tidak valid (1–500 nama, maksimal 60 karakter per nama).' });
  }

  try {
    const links = names.map(value => {
      const guestName = value.trim().replace(/\s+/g, ' ');
      const invite = createInvitationToken({ id: randomUUID(), guestName }, encryptionKey);
      const url = new URL(baseUrl);
      url.searchParams.delete('auth');
      url.searchParams.delete('to');
      url.searchParams.delete('nama');
      url.searchParams.delete('kepada');
      url.searchParams.delete('invite_id');
      url.searchParams.set('invite', invite);
      return { n: guestName, link: url.toString() };
    });

    return res.status(200).json({ links });
  } catch (error) {
    console.error('Failed to generate invitation links:', error);
    return res.status(500).json({ error: 'Gagal membuat link undangan.' });
  }
}
