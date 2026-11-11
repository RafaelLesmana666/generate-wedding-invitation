# Generator Link Undangan

Deploy this project to Vercel so the `/api/generate` serverless function can keep encryption keys off the browser.

Configure these Vercel environment variables:

- `INVITATION_TOKEN`: the same base64-encoded 32-byte key configured on the invitation site's Vercel project. Set it in both Vercel projects.
- `INVITATION_GENERATOR_SECRET`: a separate, strong password used to authorize link generation.

Generate a key with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Generate a separate generator password with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

In the generator page, enter the invitation site's URL, the generator secret, and guest names. Generated links contain only an opaque `?invite=...` AES-256-GCM token. The invitation API decrypts it and locks each unique invitation to the first device that opens it.

Do not put either environment variable in `index.html` or browser-side JavaScript. Generating links requires a deployment with the Vercel API function; opening the HTML as a local file or hosting it on a static-only service will not generate links.
