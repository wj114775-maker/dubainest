# SEO Enterprise Upgrade Plan

## Current state

The public site now has:

- route-level SEO metadata
- guide detail pages
- slugged public listing URLs
- generated XML sitemap
- generated public route manifest
- production canonical logic
- preview/sandbox `noindex,nofollow` protection
- public HTML sitemap

## Remaining enterprise upgrade items

### 1. Publish live content schemas

Required in Base44 before the public SEO layer is fully complete:

- `DeveloperProfile`
- `ProjectProfile`

Until those are live, developer/project detail URLs cannot be fully populated from live content.

### 2. Public content population

Create and publish:

- partnered developer pages
- governed project pages
- richer area pages
- more guide articles

### 3. Rendering upgrade

Highest-value technical upgrade:

- prerender or SSR for public routes

Priority routes:

- `/`
- `/properties`
- `/guides`
- `/guides/:slug`
- `/areas`
- `/areas/:slug`
- `/developers`
- `/developers/:slug`
- `/projects`
- `/projects/:slug`
- public listing detail URLs

The generated route manifest at `public/route-manifest.json` should be used as the input for that next rendering phase.

### 4. Search operations

Production launch tasks:

- verify the production domain in Google Search Console
- submit `/sitemap.xml`
- monitor index coverage
- inspect canonical URLs
- track page performance in Search Console and GA/Clarity

### 5. Ongoing content strategy

For real estate SEO growth, prioritize:

- area pages
- developer pages
- project pages
- buyer guides

Do not rely on filter URLs as primary SEO assets.

## Recommended next implementation phase

1. Publish `DeveloperProfile` and `ProjectProfile`
2. Create the first real developer and project pages
3. Add prerender/SSR for public routes using `public/route-manifest.json`
4. Expand guide and area content
