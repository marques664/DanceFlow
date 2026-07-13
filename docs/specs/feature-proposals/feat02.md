# FP-002: SaaS Security, Data Isolation & Observability

This document details the specification for evolving **DanceFlow** into a robust, secure, and production-ready multi-tenant SaaS application.

---

## 1. Multi-Tenancy Data Isolation (RLS)

To prevent cross-tenant data leaks at the database level:
- **Database Level (PostgreSQL RLS):** Configure PostgreSQL Row-Level Security (RLS) policies on all tenant-specific tables (`User`, `Student`, `Class`, `Modality`, `Lesson`, `Attendance`, `AuditLog`, `ClassSchedule`).
- **Prisma Integration:** Implement a tenant-aware Prisma Client extension that automatically injects the authenticated `schoolId` context into all queries, preventing developers from manually forgetting to filter queries.

---

## 2. API Security & Defense in Depth

To protect the Express API from scanners, DDoS, and malicious inputs:
- **Helmet Security Headers:** Integrate `helmet` to automatically configure secure HTTP headers (MIME type sniffing protection, Clickjacking defense, X-Frame-Options).
- **CORS Configuration:** Configure CORS origin restrictions to exclusively accept requests from recognized tenant subdomains (e.g. `*.danceflow.com`) in production.
- **API Rate Limiting:** Implement `express-rate-limit` to restrict request volume. Set low limits on sensitive authentication endpoints (like `/auth/login`) to prevent brute-force attacks.

---

## 3. Observability & Centralized Logging

To make the application monitorable and production-ready:
- **Structured Logging:** Replace default `console.log` and `console.error` calls with a structured logger (`pino` or `winston`).
- **Log Metadata:** Attach contextual parameters (`tenantId`, `userId`, `requestId`) to all logs to enable tracing.
- **Log Format:** Write logs as structured JSON to stdout for log aggregator shippers (e.g. Datadog, ELK).

---

## 4. Compliance & Privacy (LGPD)

To ensure legal compliance for managing children and guardian records:
- **PII Encryption:** Encrypt Personally Identifiable Information (PII) including guardian names, phone numbers, and emails in PostgreSQL using database-level crypt tools (such as `pgcrypto`) or application-level crypt libraries.
- **Logical Deletion & Data Purge:** Maintain logical deletion flags (`isActive: false`) for daily operations, but provide a secure purging API to completely remove tenant data when a school cancels their contract.
