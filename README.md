# Generator Link Undangan

Deploy this project to Vercel so the `/api/generate` serverless function can keep encryption keys off the browser.

Configure these Vercel environment variables:

- `INVITATION_TOKEN`: a strong text secret (at least 16 characters; 32 or more random characters recommended), set to the exact same value in both Vercel projects. It does not need to be base64; both backends derive the AES key from this text using scrypt.
- `INVITATION_GENERATOR_SECRET`: a separate, strong password used to authorize link generation.

Generate a strong text value for `INVITATION_TOKEN` with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Generate a separate generator password with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

In the generator page, enter the invitation site's URL, `INVITATION_GENERATOR_SECRET`, and guest names. This is a separate plain-text authorization value; it is not the encryption key. Generated links contain only an opaque, compact `?invite=...` AES-256-GCM token, which is created on the server. The invitation API decrypts it and locks each unique invitation to the first device that opens it. Previously generated three-part token links remain supported.

Do not put either environment variable in `index.html` or browser-side JavaScript. Generating links requires a deployment with the Vercel API function; opening the HTML as a local file or hosting it on a static-only service will not generate links.
