# Asset Serve

Asset Serve is a market-analytics prortotype that blends live trading data, personal watchlists, and responsive visualisations into a single developer-friendly stack. The repository pairs a secure Spring Boot back end with a Next.js front end so quantitative insights, trade ideas, and user context move together in real time.

## Highlights

- **Real-time market feed** sourced from Angel One SmartAPI, normalised into reusable DTOs with trend analytics.
- **Investor workspace** supporting authenticated watchlists, holdings snapshots, and configurable price targets.
- **Modern delivery** built with Spring Security (JWT) on the server, Next.js 14 and Tailwind on the client, and PostgreSQL for durable state.
- **Container-ready** via Docker Compose for local infrastructure, plus reusable Maven and pnpm scripts for rapid iteration.
- **Production-minded** defaults including CORS hardening, interceptor-based API access, and typed contracts between services.

## Architecture Snapshot

```
frontend/ (Next.js, TypeScript)
  └── app/ UI components, dashboard, auth flows
backend/monetary/ (Spring Boot)
  ├── controller/ REST endpoints (market data, watchlist, auth)
  ├── service/ Angel One integration, holdings, watchlist logic
  ├── dto/ Typed payloads (IndexQuote, MarketTrend, OIResponse)
  └── repository/ JPA repositories over PostgreSQL
postgres-data/ (local volume for Dockerised PostgreSQL)
```

Data enters through `MarketDataService`, where SmartAPI responses are authenticated, validated, and transformed into `IndexQuote` objects. Controllers expose `/api/v1/*` endpoints secured by JWT filters, while the Next.js layer consumes those endpoints via Axios interceptors and renders live dashboards (e.g., the price ticker and watchlist board).

## Getting Started

### Prerequisites

- JDK 17+
- Node.js 18+ and pnpm (`corepack enable`)
- Docker Desktop (for PostgreSQL via Compose)
- Angel One SmartAPI credentials (.env or application properties)

### Bootstrap the stack

1. **Configure environment**
   - Backend: set `angelone.api.key`, `angelone.client.id`, `angelone.client.password`, and `angelone.client.totp` in `backend/monetary/src/main/resources/application.properties` or through environment variables.
   - Frontend: mirror API URL and auth settings in `frontend/.env.local` (see `NEXT_PUBLIC_API_URL`).
2. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```
3. **Run the back end**
   ```bash
   cd backend/monetary
   ./mvnw spring-boot:run
   ```
4. **Run the front end**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
5. Browse to `http://localhost:3000` and sign in to explore the dashboards.

## Testing & Quality

- **Backend**: `./mvnw test` runs the Spring Boot test suite. Add contract tests around market-data DTOs before expanding coverage.
- **Frontend**: `pnpm lint` applies ESLint. Integrate Playwright or Cypress for UI regression coverage when wiring CI.

## Deployment Notes

- Package the backend with `./mvnw clean package` and deploy the resulting JAR.
- Next.js can be exported via `pnpm build`; serve with Node, Vercel, or any edge runtime supporting Next 14.
- Leverage environment-specific property files (`application-*.properties`) for credentials instead of hardcoding secrets.

## Extensibility Ideas

- Add Redis-backed caching for SmartAPI responses to smooth rate limits and accelerate dashboards.
- Layer in alerting (email/SMS) driven by watchlist target breaches.
- Instrument the services with OpenTelemetry to trace latency from SmartAPI through the React components.
