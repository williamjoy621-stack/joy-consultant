# JOY CONSULTANT — AI-Powered Real Estate Platform Deliverables

## 1. Environment Variables Documentation (`.env.example`)

- `GEMINI_API_KEY`: Server-side Google Gemini API key (`gemini-3.8-flash`) powering the AI Real Estate Chatbot, AI Property Recommendation System, and Admin AI Business Assistant. Never exposed to the browser.
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps Platform API key for interactive estate markers and corporate office maps.
- `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`: Runtime PostgreSQL connection pooling variables.
- `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`: Administrative credentials used by `drizzle-kit` for schema migrations (`src/db/drizzle.config.ts`).
- `PAYSTACK_SECRET_KEY`: Optional secret key for live Paystack transaction verification (`POST /api/payments/verify`) and webhook processing (`POST /api/webhooks/paystack`).

---

## 2. Complete PostgreSQL / Supabase SQL Schema

All 14 tables (`users`, `profiles`, `properties`, `services`, `bookings`, `orders`, `payments`, `leads`, `messages`, `favourites`, `chatbot_conversations`, `chatbot_messages`, `notifications`, `audit_logs`) are defined in `src/db/schema.ts` and deployed to PostgreSQL:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT 'Lagos',
  state TEXT DEFAULT 'Lagos State',
  role TEXT NOT NULL DEFAULT 'customer',
  preferred_location TEXT DEFAULT 'Ibeju-Lekki, Lagos',
  investment_budget BIGINT DEFAULT 15000000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  coordinates_lat TEXT NOT NULL,
  coordinates_lng TEXT NOT NULL,
  price_ngn BIGINT NOT NULL,
  size_sqm INTEGER NOT NULL,
  plot_count INTEGER NOT NULL DEFAULT 12,
  category TEXT NOT NULL,
  documentation_status TEXT NOT NULL,
  survey_plan_status TEXT NOT NULL DEFAULT 'Verified & Registered',
  deed_of_assignment_status TEXT NOT NULL DEFAULT 'Ready for Execution',
  c_of_o_status TEXT NOT NULL DEFAULT 'Verified in State Registry',
  survey_plan_number TEXT NOT NULL,
  availability_status TEXT NOT NULL DEFAULT 'Available',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  landmarks TEXT NOT NULL,
  payment_plan_summary TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'coastal-estate',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
```

*(See `src/db/schema.ts` for the complete Drizzle ORM definition of all 14 tables.)*

---

## 3. Step-by-Step Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Apply Database Schema**:
   Ensure `SQL_HOST`, `SQL_DB_NAME`, `SQL_ADMIN_USER`, and `SQL_ADMIN_PASSWORD` are set, then push the schema via Drizzle Kit (`src/db/drizzle.config.ts`).
3. **Build Frontend Assets**:
   ```bash
   npm run build
   ```
4. **Start Production Server**:
   ```bash
   npm run start
   ```
   The Express server (`server.ts`) serves the built React SPA and handles `/api/*` routes on port `3000`.
