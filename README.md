**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
VITE_RECAPTCHA_SITE_KEY=your_public_recaptcha_site_key

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Phase 3 verification**

Run the local verification bundle:

```bash
npm run verify:phase3
```

Phase 3 handoff docs:

- `docs/phase3-signoff.md`
- `docs/phase3-live-qa-checklist.md`
- `docs/phase3-test-data-matrix.md`

Phase 4 foundation docs:

- `docs/phase4-foundation.md`
- `docs/phase4-live-qa-checklist.md`

Phase 5 foundation docs:

- `docs/phase5-foundation.md`
- `docs/phase5-live-qa-checklist.md`

Run the local verification bundle:

```bash
npm run verify:phase5
```

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**reCAPTCHA v3**

Public forms use reCAPTCHA v3 on the buyer-facing website.

- Client-side site key: set `VITE_RECAPTCHA_SITE_KEY` in `.env.local` if you need to override the default public key.
- Server-side verification: set `RECAPTCHA_SECRET_KEY` in the Base44 function environment before publishing.
- Optional server-side settings:
  - `RECAPTCHA_MIN_SCORE`
  - `RECAPTCHA_EXPECTED_HOSTNAME`

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
