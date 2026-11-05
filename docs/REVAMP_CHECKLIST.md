# Iris web revamp checklist

Status key: `[ ]` to do, `[x]` done and verified, `[!]` needs the owner (account access or a decision).

## Hard rules from the owner

- The website is an add-on. Nothing here may affect the mobile app: `~/Desktop/rork` is read-only reference, with no edits, commits or deploys from it.
- The Supabase project is shared with the app. No changes to existing tables, columns, functions, triggers, buckets or auth settings the app uses. Only additive, website-only objects, and only after owner approval.
- Dodo Payments is website-only and independent of the app. It lives in this repo (`functions/`), not in Supabase edge functions under `rork/`, and never writes the app's subscription or credit columns in `profiles`.
- The Dodo API key goes in Cloudflare environment secrets only, never in the repo or the browser bundle.

## 0. Findings from the audit (verified 2026-11-05)

| Area | Finding | Evidence |
|---|---|---|
| Google sign-in | Google rejects the request: `Error 400: redirect_uri_mismatch`. Not a website bug. | Live sign-in run in a headless browser |
| Apple sign-in | Supabase returns `400 Unsupported provider: missing OAuth secret` | `/auth/v1/authorize?provider=apple` |
| Supabase Site URL | Still `hireswipe-v3-clone-ceuofke.rork.app`; irisjobs.live is allow-listed | Callback probe |
| Inbox crash | `groupThreads` uses `map` without declaring it, so any mailbox with mail throws | `src/pages/inbox/Inbox.tsx:48` |
| Onboarding | 7 steps with resume last; Rork has 15 with resume and user type first; Back disabled on step 1 | `Onboarding.tsx`, `rork/app/onboarding.tsx` |
| Dodo checkout | Trusts `user_id` from the body; endpoint and URL differ from Dodo's API | `rork/supabase/functions/dodo-checkout` |
| Dodo webhook | Skips verification if the secret is unset; writes columns the app doesn't use; never grants real credits | `rork/supabase/functions/dodo-webhook` |
| www | `www.irisjobs.live` serves a 200 duplicate | Live probe |
| 404s | Unknown URLs return the homepage with 200 (soft 404) | `/nope` |
| Caching | `/app/assets/*` is `no-store`, so every visit re-downloads hashed bundles | `public/_headers` |
| Analytics | No GA4, Search Console or Bing verification tags | Live HTML |
| Stale page | `/how-it-works/` is live with `x-robots-tag: noindex` but removed from the repo | Live probe, commit 8ec3125 |
| Shared logic | `shared/` matches Rork's `lib` and `constants`; feed hook still to compare | `diff` |

## 1. Owner actions (cannot be done from code)

- [!] Google Cloud Console: add `https://widujxpahzlpegzjjpqp.supabase.co/auth/v1/callback` to the authorised redirect URIs of OAuth client `785222584965-29ja…`
- [!] Apple Developer: create a Services ID and Sign in with Apple key, generate the secret, and add them in Supabase Auth, then set `APPLE_WEB_ENABLED = true`. Keep the app's bundle ID `app.nextquark.hireswipe` in Supabase's Apple client ID list, or native Apple sign-in in the app could break
- [!] Leave the Supabase Site URL alone unless the app is confirmed not to depend on it. The website passes its own redirect URL, which is already allow-listed
- [x] Dodo live: 12 products, webhook, Cloudflare secrets and billing tables are set up
- [!] Google Search Console, Bing Webmaster Tools, GA4: create properties and send the verification codes and Measurement ID
- [!] Keep `/.well-known`, `/job`, `/post`, `/invite`, `/iris`, `/download` working on www: the mobile app registers www for app links, so the redirect exempts them
- [!] Cloudflare: confirm `www` DNS stays proxied so the redirect runs
- [!] Blog: real author name and bio; review the competitor comparisons
- [x] Commit, push and deploy

## 2. Not promised

- A Forbes backlink and ranking #1 by Friday cannot be engineered or guaranteed. Rankings take weeks to months and depend on Google. Links have to be earned through outreach.

## 3. Design system

- [x] Tokens: warm paper background, ink CTAs, Iris violet accent, soft shadows, light and dark
- [x] Type: serif display, clean sans body, mono overlines
- [x] Iris logo (transparent) everywhere, including favicon and blog
- [x] Shared parts: page header, cards, chips, pills, stat strip, skeletons, empty states
- [x] Responsive rules from 320px up, with safe-area support

## 4. Auth

- [x] Back to landing page on sign-in, sign-up and forgot password
- [x] Replace the product video on the auth page
- [ ] Clear OAuth errors; Apple hidden until configured

## 5. Onboarding (Rork parity with the new design)

- [x] Split layout: image card with `NN / NN · LABEL` and caption, questions on the right
- [x] Step 1: resume upload with parsing, then Fresher / Job Switch / Laid Off
- [x] Basic info, demographics, experience level, desired roles, goal, work authorization, work preferences, additional info, application password, resume optimization, referral, heard about us, founder note
- [x] Back always works; step 1 Back leaves to landing or signs out
- [x] Progress persists and resumes
- [x] Final "agent brief" summary, then first job pick
- [x] Mobile layout

## 6. App pages

- [x] Shell: collapsible sidebar, top bar with credits pill, mobile tab bar
- [x] Home (`/app`): goal hero, preference chips, Jobs for you, recent applications
- [x] Jobs: swipe deck plus feed cards, loading skeletons, free-limit paywall
- [x] Search: full page with suggestions and companies to follow
- [x] Applications: stats, filters, sort, table
- [x] Tracker: replies by stage, using the existing inbox data
- [x] Inbox: fix crash, redesign
- [x] Iris: rebuild from Rork `app/iris.tsx`
- [x] Profile: header card, on-this-page nav, sections
- [x] Account (settings): Personal, Apply settings, Job preferences, Job boards, Billing and usage
- [x] Plans, Free credits, Saved, Help redesign
- [x] Remove Interviews (routes, nav, code)

## 7. Data and performance

- [x] Feed drift check against Rork
- [x] Persist React Query cache per user; clear on sign-out
- [x] Limit columns and page sizes to reduce Supabase egress
- [x] Immutable caching for hashed assets

## 8. Payments

- [x] New `functions/api/dodo/checkout` in this repo: verify the Supabase JWT, correct Dodo API, region pricing
- [x] New `functions/api/dodo/webhook` in this repo: mandatory signature, idempotent
- [x] Website-only billing table and credit ledger (additive, after approval); app columns in `profiles` never written
- [x] Do not use or deploy `rork/supabase/functions/dodo-*`
- [x] Plans page checkout and return states
- [ ] End-to-end test in Dodo test mode (real checkout session verified; paid flow needs secrets and deploy)

## 9. Blog and SEO

- [ ] PAUSED by owner: 100 posts total (28 live, 30 unpublished drafts in content/blog-drafts/) with original, factual content (no invented stats or quotes)
- [ ] Sourced competitor comparisons
- [x] Author bio page; related links so no post is orphaned
- [ ] Unique titles under 60 characters and unique descriptions; duplicate checks
- [x] Canonical, one H1 per page, breadcrumbs, FAQ and Article schema, alt text
- [x] WebP images with explicit dimensions
- [x] www to non-www redirect, real 404 page, remove stale redirects
- [x] robots.txt, sitemap.xml, llms.txt, GA4 and verification tags behind config
- [x] `noindex` removed from public pages. Signed-in `/app/*` stays `noindex` because it has no public content
- [x] Core Web Vitals check with Lighthouse

## 10. Verification

- [x] Typecheck and production build
- [ ] Screenshots of every page at 375, 768 and 1440 widths in light and dark
- [x] Rendered-page SEO audit script across all URLs
