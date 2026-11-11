const { createCipheriv, randomBytes, scryptSync } = require('node:crypto');

const TOKEN_AAD = Buffer.from('wedding-invitation:v1');
const KEY_SALT = Buffer.from('wedding-invitation:INVITATION_TOKEN:v1');

function getInvitationKey(value = process.env.INVITATION_TOKEN) {
  const secret = typeof value === 'string' ? value.trim() : '';
  if (secret.length < 16) {
    throw new Error('INVITATION_TOKEN must contain at least 16 characters.');
  }

  return scryptSync(secret, KEY_SALT, 32);
}

function createInvitationToken({ id, guestName }, key = getInvitationKey()) {
  const payload = JSON.stringify({ v: 1, id, guestName: guestName.trim() });
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);

  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

module.exports = { createInvitationToken, getInvitationKey };
