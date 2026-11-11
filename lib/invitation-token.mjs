import { createCipheriv, randomBytes } from 'node:crypto';

const TOKEN_AAD = Buffer.from('wedding-invitation:v1');

export function getInvitationKey(value = process.env.INVITATION_TOKEN) {
  if (!value) {
    throw new Error('INVITATION_TOKEN environment variable is missing.');
  }

  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64').replace(/=+$/, '') !== value.trim().replace(/=+$/, '')) {
    throw new Error('INVITATION_TOKEN must be a base64-encoded 32-byte key.');
  }

  return key;
}

export function createInvitationToken({ id, guestName }, key = getInvitationKey()) {
  const payload = JSON.stringify({ v: 1, id, guestName: guestName.trim() });
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);

  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}
