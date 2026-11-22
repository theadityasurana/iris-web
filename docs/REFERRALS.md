# Influencer referral system: operating guide

How to run the influencer promo-code program on irisjobs.live.
**Password and live links:** `docs/REFERRALS.private.md` (on your laptop only, never committed to git).

---

## 1. What it is

| Page | URL | Who sees it |
|---|---|---|
| Admin dashboard | https://irisjobs.live/referrals/admin/ | You only (password protected) |
| Influencer dashboard | `https://irisjobs.live/partner/<their-url>` | The influencer you send it to |
| Self-serve sign-up | https://irisjobs.live/partners/join/ ("Become a partner" in every footer) | Anyone |

The dashboards are hidden from search engines; the sign-up page is public and in the sitemap. Neither page is linked from anywhere on the website.

- **Admin dashboard:** leaderboard of every influencer, with purchases, net revenue, share %, earned, paid and due. You add, edit, pause and delete influencers here and record payouts.
- **Influencer dashboard:** that one influencer's purchases, plans chosen, recent purchases, and their own earnings (earned, paid, pending). They never see buyer names or emails, your gross revenue or other influencers' numbers.

---

## 2. Onboarding a new influencer

1. **Create the promo code in Dodo Payments** (dashboard → Discounts). Set the discount you agreed (e.g. 10% off), and the code (e.g. `PRIYA10`).
   - Codes work at checkout automatically; the website already allows discount codes.
2. **Open the admin dashboard** and log in.
3. Under **Add an influencer**, fill in:
   - **Name**
   - **Promo code**: exactly the code from Dodo. Case doesn't matter. Codes in Dodo that aren't linked to anyone yet are listed as one-click buttons under the form.
   - **Share %**: their cut of net revenue (e.g. 20, 25, 30).
   - **Dashboard URL** (optional): leave blank for an auto one like `priya-x7k2q`. The random ending stops people guessing other influencers' links.
4. Click **Add** → copy the link it shows → send it to the influencer.

If the row shows **"code not found in Dodo"**, the code was typed differently or doesn't exist in Dodo yet. Fix it in Dodo or click **Edit**.

### 2b. Self-serve sign-up (no work for you)

Anyone can click **Become a partner** in the site footer → `/partners/join/` → enter name, email and the social profile they'll post from. Instantly:

1. A **10%-off Dodo code** is created from their name (same settings as your hand-made codes): `PRIYA10`, or `PRIYAK10` / `PRIYAKAPOOR10` / `PRIYA472` if taken.
2. They're added to your leaderboard at the default **20%** share, tagged **"signed up themselves"**, with their email and social shown so you can pay them.
3. They land on their dashboard with a banner telling them to save the link. There's no login, so the link is their only way back in. Lost links: they DM @irisjobs.live and you send it from the admin page.

Spam limits: hidden bot-trap field, max 3 sign-ups per network per day, 100 per day overall, one account per email.

To remove a junk sign-up: **Delete** on the admin page, then also delete its code in Dodo (Discounts), since deleting a partner leaves the Dodo code active.

Note: nothing stops a partner using their own code on their own purchase (they'd get 10% off plus their share). Check the admin page now and then for odd patterns.

---

## 3. How purchases and money are counted

**A purchase** = a Dodo subscription bought with the influencer's code whose first payment went through. Pending or failed checkouts don't count.

**Only the purchase counts.** Renewals and plan changes earn the influencer nothing. Each subscriber counts once, for their first payment.

**Net revenue** (per purchase, in USD) comes from Dodo's own ledger, so it uses the *real* deductions, not an estimate:

```
net = amount charged − tax (GST/VAT) − Dodo's actual fee
```

Example (real payment): ₹884 charged = $9.05 → −$1.38 GST → −$0.71 Dodo fee → **$6.96 net**.

**Influencer earnings:**

```
earned = net × share %
due    = earned − paid so far
```

All money is in **USD**, whatever currency the buyer paid in (INR, GBP, …). Dodo converts it.

**Refunds:** a fully refunded purchase is dropped from net revenue and earnings. Partial refunds are not subtracted.

**Timing:** numbers refresh within about a minute. A new purchase can show as "settling" until Dodo records its fees; it gets an earnings amount once settled. Click **Refresh from Dodo** on the admin page to skip the 1-minute cache.

---

## 4. Paying influencers

1. On the admin dashboard, the **Due** column shows what you owe each person, and the top card shows the total owed.
2. Pay them however you normally do (UPI, bank, PayPal…). The system does not send money.
3. Record it:
   - **Paying the full amount due:** click **Mark paid** → **Confirm**. This sets "paid so far" equal to everything earned.
   - **Paying a partial or custom amount:** click **Edit** and set **Paid so far (USD)** to the new running *total* paid (not just this payment), then **Save**.

"Paid so far" is a running total. To fix a mistake, edit it to the correct total.

---

## 5. Day-to-day actions (admin dashboard)

| Want to… | Do this |
|---|---|
| Change someone's share % | **Edit** → Share % → Save. Applies to all their earnings, past and future. |
| Change their link | **Edit** → URL → Save. The old link stops working; send them the new one. |
| Pause an influencer's dashboard | **Turn off**. Their link shows "not active"; their numbers are kept. **Turn on** restores it. |
| Remove an influencer | **Delete** → **Confirm delete**. Removes them from the dashboard only. The Dodo code keeps working until you disable it in Dodo. |
| Swap a code | Create the new code in Dodo, then **Edit** → Promo code. Only purchases with the new code will count. |
| Private notes | **Edit** → Notes. Only you see them. |

Changing the share % recalculates **all** of that person's earnings, not just future ones. If a deal changes mid-way, record what you've paid first and adjust "paid so far" if needed.

---

## 6. Admin password

- The password is stored as the Cloudflare Pages secret **`REFERRAL_ADMIN_KEY`** on project **`nextquark-links`**. Cloudflare can't show it again, so keep the copy in `docs/REFERRALS.private.md`.
- The browser remembers it after you log in. Use **Log out** on shared computers.
- **To change it** (e.g. if it leaks), run this from the project folder:
  ```sh
  printf '%s' 'NEW-PASSWORD-HERE' | npx wrangler pages secret put REFERRAL_ADMIN_KEY --project-name nextquark-links
  ```
  Then trigger a deploy (push any commit to `main`, or "Retry deployment" in Cloudflare), and update `docs/REFERRALS.private.md`.

---

## 7. How it's built (for developers)

| Piece | Where |
|---|---|
| Partner list (name, code, URL slug, share %, paid so far, notes, on/off) | Supabase table `public.web_referral_partners`. RLS is on with no policies, so only the service role can access it. Migrations: `supabase/migrations/20261122_web_referral_partners.sql`, `20261122b_referral_commission.sql` |
| Sales, fees, tax | Read live from the Dodo API: discounts, subscriptions, payments and the balance ledger. Nothing is copied into the database. |
| Shared logic (matching codes, first-payment rule, net/earnings math) | `functions/_lib/referrals.js` |
| Admin API (`X-Admin-Key` header required) | `functions/api/referrals/admin.js` |
| Self-serve sign-up API (creates the Dodo code + partner) | `functions/api/referrals/join.js`; page `public/partners/join/index.html`; footer link also in `scripts/site_parts.py` (blog template) |
| Sample dashboard (fictional "Riya Malhotra") | `functions/_lib/referral-demo.js` |
| Public influencer API | `functions/api/referrals/partner/[slug].js` |
| Pages | `public/referrals/admin/index.html`, `public/partner/index.html` (served for `/partner/*` via `public/_redirects`) |
| Tests | `scripts/tests/referrals.test.mjs` (run `npm test`) |

**Matching:** every Dodo subscription records the discount it was bought with (`discount_id`). The discount's code is matched (case-insensitive) to the partner's code. The purchase payment is the subscription's payment with `charge_type: "new"`. Its net is the sum of that payment's Dodo balance-ledger entries (payment credit − tax − payment_fees, using `usd_equivalent_amount`).

**Caching:** the full Dodo snapshot is cached for 60 s; each payment's ledger net is cached for 7 days (settled fees don't change).

**Website-only:** the mobile app never reads any of this. Deploys go out automatically when you push to `main` (Cloudflare Pages project `nextquark-links`).

**Cloudflare secrets used:** `REFERRAL_ADMIN_KEY`, `DODO_PAYMENTS_API_KEY`, `DODO_ENV`, `SUPABASE_SERVICE_ROLE_KEY`, `DODO_PRODUCT_*`.

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Wrong admin password" | Typo, or the secret was changed. See section 6. |
| "code not found in Dodo" | The code is spelled differently in Dodo, or was deleted or expired there. |
| Purchase shows but earnings are $0 / "settling" | Dodo hasn't recorded the fees yet. Check again later. If it still shows after a day, the ledger read is failing; check Cloudflare Functions logs for `nextquark-links`. |
| Influencer says the link doesn't work | It's turned off, or the URL was changed. Check their row on the admin page. |
| "Something went wrong loading referral data" | Dodo API or Supabase was briefly unreachable. Refresh in a minute. |
| Numbers look stale | Click **Refresh from Dodo** (skips the 1-minute cache). |
