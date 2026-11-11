const { createCipheriv, createHash, randomBytes, scryptSync } = require('node:crypto');

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
  const cleanName = typeof guestName === 'string' ? guestName.trim() : '';
  if (
    typeof id !== 'string'
    || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)
    || !cleanName
    || cleanName.length > 60
  ) {
    throw new Error('Invitation ID or guest name is invalid.');
  }

  const idBytes = createHash('sha256').update(id).digest().subarray(0, 16);
  const nameBytes = Buffer.from(cleanName, 'utf8');
  if (nameBytes.length > 255) {
    throw new Error('Guest name is too long to encode.');
  }

  const payload = Buffer.concat([
    Buffer.from([1]),
    idBytes,
    Buffer.from([nameBytes.length]),
    nameBytes
  ]);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

module.exports = { createInvitationToken, getInvitationKey };
