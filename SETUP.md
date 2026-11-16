# CopyVault setup

## Requirements
- Node.js 20+
- Neon PostgreSQL database
- Vercel Blob store (only if document uploads are needed)

## Local setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Run `npm run hash-password` and paste the resulting hash into `ADMIN_PASSWORD_HASH`. Use a unique password of at least 12 characters. Do not put the plaintext password in Git.
4. Set `DATABASE_URL`, `ADMIN_USERNAME=admin`, and a random `SESSION_SECRET` (at least 32 characters).
5. In the Neon SQL editor, execute `database/schema.sql`.
6. For uploads, create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`.
7. Set public WhatsApp / Telegram URLs in the environment.
8. Run `npm run dev`; before deployment run `npm run typecheck` and `npm run build`.

## Vercel environment variables
Set all required variables for Production, Preview, and Development as appropriate:
- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `BLOB_READ_WRITE_TOKEN` (optional until uploads are enabled)
- `NEXT_PUBLIC_WHATSAPP_URL`
- `NEXT_PUBLIC_TELEGRAM_URL`
- `NEXT_PUBLIC_SITE_URL`

## Security notes
- Admin credentials are environment-only; passwords are bcrypt-hashed.
- Admin session is an 8-hour signed JWT in an HttpOnly, Secure-in-production, SameSite=Strict cookie.
- Mutating endpoints check Origin and session; login has a database-backed IP rate limit.
- SQL uses parameterized tagged templates.
- Uploads allow PDF/TXT/DOCX up to 5 MB. MIME and extension are both checked.
- Keep the repository free of secrets and rotate credentials if exposed.
- Configure Neon backups/branching and review Vercel logs. Apply a managed WAF / additional bot protection before public launch.

No application can honestly promise 100% security. This is a security-conscious baseline that still requires dependency updates, deployment configuration, and testing in the target environment.
