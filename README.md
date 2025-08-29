# MyFoodMatrics — Your pocket-nutritionist: meals, macros, and more instantly,

From photo to full nutrition breakdown in seconds accuracy you can trust

> **Status:** Pre‑alpha • <50 early users • Rapid iteration • Privacy‑first

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Stage](https://img.shields.io/badge/stage-pre--alpha-orange)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Slides](https://img.shields.io/badge/Pitch-Deck_\(slide.io\)-6FCF97)](https://slide.io/myfoodmatrics-deck)

---

## Vision

Logging food should feel **effortless**. Snap a photo or speak naturally; get **clear nutrition**, **diet compatibility**, and **gentle coaching** that fits real life.

**Near‑term goal (0→50 users):** validate delight and accuracy for 3 primary jobs‑to‑be‑done:

1. *"Log this quickly"* → photo/voice to structured meal under **5s p95**.
2. *"Is this good for me?"* → simple A–D score + key micronutrients.
3. *"What should I have instead?"* → 1–2 swap suggestions.

> We intentionally avoid inflated claims; accuracy is continuously measured and reported in‑app.

---

## Problem → Solution

**Problems**

* Manual logging is tedious → **Abandonment** in days.
* Nutrition labels are confusing → **Decision fatigue**.
* Allergy/diet checks require extra work → **Risk** & **friction**.

**MVP Solution**

* **Photo → Meal**: client‑side pre‑parse + server AI refine (structured: items, qty, units).
* **Voice logging (premium later)**: hands‑free speech → meal JSON.
* **Simple health score**: macro balance + sodium/sugar caps + custom diet rules.
* **Allergen & diet flags**: highlights with friendly alternatives.

Roadmap features (post‑MVP): barcode scanner, sustainability scoring, recipe generation, mood/energy correlations.

---

## 🧱 Architecture (lean & auditable)

flowchart LR
  A["Web (Next.js)"] -->|HTTPS| B["API (Node / NestJS)"]
  M["Mobile (Expo)"] -->|HTTPS| B
  B -->|Auth| C["Cognito"]
  B -->|SQL| D["PostgreSQL (AWS RDS)"]
  B -->|Files| E["S3"]
  B -->|Jobs| F["SQS / BullMQ"]
  F --> G["AI Workers"]
  G --> H["OpenAI Vision / Whisper"]
  G --> I["OCR (Tesseract / Textract)"]
  B --> J["Analytics (PostHog)"]


## 🗂️ Monorepo Layout

```
myfoodmatrics/
├─ README.md
├─ LICENSE
├─ .github/workflows/{ci.yml,release.yml,codeql.yml}
├─ docs/
│  ├─ architecture.md
│  ├─ kpis.md
│  ├─ onboarding.md
│  └─ privacy.md
├─ client/            # Next.js web
│  ├─ src/
│  ├─ public/
│  └─ package.json
├─ server/            # NestJS API
│  ├─ src/
│  ├─ tests/
│  ├─ prisma/ (or migrations/)
│  └─ package.json
├─ middleware/        # workers (BullMQ/SQS)
│  └─ src/
├─ ml/                # scoring rules, prompt templates
│  ├─ pipelines/
│  └─ evaluation/
├─ shared/            # DTOs, schemas, utils
│  └─ src/
└─ infra/             # Terraform/CDK + envs
   └─ aws/
```

---

## 📦 Tech Choices

* **Web:** Next.js (App Router), React Query, Tailwind.
* **Mobile:** Expo (later), shared component library.
* **API:** NestJS, Zod for validation, OpenAPI docs.
* **DB:** PostgreSQL (AWS RDS) + Prisma.
* **Storage:** S3 (original + optimized images), CloudFront CDN.
* **Auth:** Amazon Cognito (email + SSO later).
* **AI:** OpenAI Vision/Whisper; deterministic post‑processors.
* **Analytics:** PostHog (self‑host optional) with privacy filters.
* **CI/CD:** GitHub Actions → deploy via Terraform to AWS.

---

## 🧪 MVP Scope (truthful & measurable)

* p95 time: **≤5s** photo→meal; **≤8s** worst‑case first run.
* First session success: **≥70%** (user logs 1 meal without help).
* Weekly retention target (seed): **≥35%** for the first 50 users.
* Accuracy is reported as: **top‑k recognition** + **portion error bands**.

**Out of scope (for now):** offline mode, complex recipes, mood correlations, full sustainability LCA.

---

## 🔐 Privacy & Data Handling

* **Data minimization**: store text meal representation; images optional/ephemeral (auto‑delete in 7 days unless user saves).
* **Encryption**: TLS in transit; AES‑256 at rest (S3 + RDS).
* **User controls**: export/delete data; explicit consent for images/voice.
* **Model inputs**: PII redaction before sending to upstream providers.

---

## 🧰 Getting Started (Dev)

```bash
# 1) Clone
git clone https://github.com/myfoodmatrics/myfoodmatrics
cd myfoodmatrics

# 2) Install (pnpm recommended)
npm i -g pnpm
pnpm i

# 3) Env
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill: DATABASE_URL, OPENAI_API_KEY, AWS creds, COGNITO config

# 4) Dev
pnpm -w dev  # runs client & server concurrently

# 5) Test
pnpm -w test
```

**server/.env.example**

```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/myfoodmatrics
OPENAI_API_KEY=sk-...
AWS_REGION=us-east-1
S3_BUCKET=myfoodmatrics-assets
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
POSTHOG_KEY=phc_...
```

---

## 🔎 API Sketch (OpenAPI excerpt)

```yaml
paths:
  /v1/analysis/photo:
    post:
      summary: Photo → structured meal
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                image: { type: string, format: binary }
                sessionId: { type: string }
      responses:
        '200': { description: Meal JSON }
  /v1/analysis/voice:
    post:
      summary: Voice → structured meal (experimental)
```

**Meal JSON (minimal)**

```json
{
  "timestamp": "2025-08-29T12:30:00Z",
  "items": [
    { "name": "oatmeal", "qty": 1, "unit": "cup", "confidence": 0.82 },
    { "name": "blueberries", "qty": 0.5, "unit": "cup", "confidence": 0.77 }
  ],
  "score": { "grade": "B", "explanations": ["high fiber", "added sugar low"] },
  "flags": { "allergens": ["gluten?"], "diets": ["vegetarian"] }
}
```

---

## 🧭 KPIs for Seed (<50 users)

* **Activation:** % first session reaching 1 logged meal.
* **D1/D7 Retention:** day‑1 and day‑7 return rates.
* **p95 Latency:** photo→meal total time.
* **Accuracy:** top‑1/top‑3 label match; portion error band.
* **Support tickets:** per 10 users.

Cadence: weekly review; small A/Bs; share lightweight investor updates monthly.

---

## 🛣️ Roadmap (next 90 days)

**Month 1**

* Ship reliable photo analysis; add basic A–D score.
* Cohort‑based analytics dashboard; error replay tooling.

**Month 2**

* Guided corrections UI (edit items/quantities easily).
* Add barcode lookup (OpenFoodFacts) as fallback.

**Month 3**

* Voice logging (opt‑in alpha).
* Export/delete controls; data retention UI.

---

## 🤝 Contributing

* Conventional Commits; small PRs; checklist enforced in CI.
* Branch naming: `feature/…`, `fix/…`, `chore/…`.

---

## 🛡️ CI/CD (GitHub Actions)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i --frozen-lockfile
      - run: pnpm -w build
      - run: pnpm -w test -- --coverage
```

---

## 📜 License

MIT — see `LICENSE`.

---

## 📞 Contact

* [hello@myfoodmatrics.com](mailto:hello@myfoodmatrics.com) • [investors@myfoodmatrics.com](mailto:investors@myfoodmatrics.com) • [dev@myfoodmatrics.com](mailto:dev@myfoodmatrics.com)

**Slides:** add pitch link here → `https://slide.io/myfoodmatrics-deck`
