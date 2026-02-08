# MFI Clarity - Market Launch Checklist

> Assessment Date: 2026-02-08
> App: MFI Clarity — Microfinance Institution Management System (Ghana / BoG-regulated)
> Stack: React 18 + TypeScript + Vite + Supabase + Tailwind / shadcn-ui

---

## Executive Summary

MFI Clarity is approximately **70% complete** for a production market launch. The frontend architecture is solid and well-organized, with most core MFI features implemented. However, there are **critical gaps** in security, testing, documentation, and production infrastructure that must be addressed before handling real financial data.

---

## 1. CRITICAL — Must Fix Before Launch

### 1.1 Security Vulnerabilities

- [ ] **Remove demo-mode auth bypass** — `src/pages/ProtectedRoute.tsx` allows unauthenticated access when `sessionStorage` has `mfi_demo_mode=true`. Any user can set this in the browser console to bypass login entirely. This must be removed or restricted to development builds only.
- [ ] **Implement backend license validation** — `src/pages/ActivateLicense.tsx` uses hardcoded license codes (`MFI-2024-TRIAL`, etc.) validated entirely on the client. Replace with server-side validation via a Supabase Edge Function or external API.
- [ ] **Add Content Security Policy (CSP) headers** — No CSP is configured, leaving the app vulnerable to XSS injection. Add appropriate headers via your hosting provider or a meta tag.
- [ ] **Fix 6 npm vulnerabilities** — `npm audit` reports 4 moderate and 2 high severity issues. Run `npm audit fix` and verify nothing breaks.
- [ ] **Enforce HTTPS in production** — No HTTPS enforcement is documented. Configure redirect rules at the hosting/CDN level.
- [ ] **Audit Supabase Row-Level Security (RLS) policies** — Verify that every table has appropriate RLS policies so tenants cannot read/write each other's data. This is the #1 security concern for a multi-tenant financial app.
- [ ] **Remove or rotate exposed Supabase keys** — The `.env` file contains project credentials. Ensure these are not checked into version control and rotate any previously committed keys.

### 1.2 Testing (Zero Tests Exist)

- [ ] **Set up test framework** — Add Vitest (natural fit with Vite) + React Testing Library.
- [ ] **Unit tests for financial calculations** — Loan interest, PAR calculations, provisioning ratios, CAR computation. These handle real money and regulatory numbers — bugs here are existential.
- [ ] **Unit tests for BoG classification logic** — Current/OLEM/Substandard/Doubtful/Loss bucketing must be provably correct.
- [ ] **Unit tests for offline sync & conflict resolution** — The IndexedDB sync queue and conflict detection logic are complex and must be tested.
- [ ] **Integration tests for auth flows** — Login, registration, password reset, session expiry, protected route enforcement.
- [ ] **E2E tests for critical paths** — Loan creation → disbursement → repayment → classification. Consider Playwright or Cypress.

### 1.3 Data Integrity

- [ ] **Replace all mock/fallback data with real Supabase queries** — `src/hooks/useMfiData.ts` and several report pages fall back to mock data when the DB is empty or misconfigured. In production this would display fake numbers to users.
- [ ] **Validate all currency calculations use proper decimal handling** — Floating-point arithmetic with Cedis/Pesewas can cause rounding errors. Audit every money calculation.
- [ ] **Add database constraints** — Ensure negative loan amounts, duplicate disbursements, and orphaned repayments are impossible at the DB level, not just the UI level.

---

## 2. HIGH PRIORITY — Should Fix Before Launch

### 2.1 Production Infrastructure

- [ ] **Set up CI/CD pipeline** — No `.github/workflows` exist. Add automated build, lint, and test on every PR.
- [ ] **Code-split the application** — The JS bundle is **1.86 MB** (480 KB gzipped). Use dynamic `import()` for route-level splitting. Dashboard, Reports, Data Entry, and Field Operations should be separate chunks.
- [ ] **Add centralized error monitoring** — No Sentry, LogRocket, or equivalent. When production errors occur, you need to know immediately.
- [ ] **Add React Error Boundaries** — No error boundary components exist. A single uncaught error crashes the entire app.
- [ ] **Create production environment configuration** — No `.env.production.example`, no deployment documentation.
- [ ] **Set up database backup strategy** — Document and automate Supabase backup/recovery procedures.
- [ ] **Add health monitoring / uptime checks** — For a financial app, downtime directly costs money.

### 2.2 Feature Completeness

- [ ] **Complete Board Dashboard panels** — Some tabs (Strategic KPIs, Risk Analysis, Trends & Peers) may still use placeholder data.
- [ ] **Complete Departmental Reports** — Page structure exists but data integration may be incomplete.
- [ ] **Portfolio Aging report** — Verify it's pulling real data, not mock aging buckets.
- [ ] **Repayment schedule generation** — Verify amortization tables are accurate for all loan product types.
- [ ] **Bulk data import** — MFIs migrating from spreadsheets or other systems need CSV/Excel import capability.
- [ ] **PDF/Excel export for all reports** — Regulatory submissions to BoG require downloadable report formats.
- [ ] **SMS/email notifications** — Loan due date reminders, overdue alerts, and collection assignments.

### 2.3 User Experience

- [ ] **Add loading skeletons** — Replace generic spinners with content-aware skeleton screens.
- [ ] **Improve mobile responsiveness** — Field officers use phones. Test and optimize every data-entry and collection screen for mobile.
- [ ] **Add keyboard navigation** — For data-entry-heavy workflows, tab order and keyboard shortcuts matter.
- [ ] **Add user onboarding flow** — First-time setup wizard for new organizations (configure tiers, loan products, staff roles).

---

## 3. MEDIUM PRIORITY — Should Address Around Launch

### 3.1 Documentation

- [ ] **Write deployment guide** — Step-by-step instructions for deploying to production (Vercel, Railway, or self-hosted).
- [ ] **Create API/schema documentation** — Document all Supabase tables, RLS policies, and Edge Functions.
- [ ] **Write user manual** — MFI staff are not always tech-savvy. Create role-specific guides (loan officer, manager, board member).
- [ ] **Add developer setup guide** — Replace the generic README with actual project-specific instructions.
- [ ] **Create CHANGELOG** — Track versions and what changed for audit purposes.

### 3.2 Compliance & Audit

- [ ] **Independent BoG calculation audit** — Have a domain expert verify every regulatory formula (CAR, liquidity ratios, provisioning).
- [ ] **Penetration testing** — Before handling real financial data, engage a security firm for a pentest.
- [ ] **Data protection compliance** — Ghana's Data Protection Act (2012) requires specific handling of personal data. Document your compliance approach.
- [ ] **Audit trail integrity** — Verify audit logs cannot be modified or deleted by any user, including admins.
- [ ] **Session timeout policy** — Financial apps should auto-logout after inactivity. Implement and make configurable.

### 3.3 Performance

- [ ] **Add database indexes** — Review Supabase query performance for large datasets (1000+ loans, 5000+ repayments).
- [ ] **Implement pagination** — Large tables (clients, loans, transactions) need server-side pagination.
- [ ] **Optimize React Query caching** — Review stale times and cache invalidation for financial data freshness.
- [ ] **Test with realistic data volumes** — Create seed data simulating a real MFI (500+ clients, 2000+ loans, 10000+ repayments).

---

## 4. LOW PRIORITY — Post-Launch Improvements

- [ ] **Multi-language support (i18n)** — Ghanaian MFIs may need Twi, Ewe, or Ga interfaces.
- [ ] **Advanced analytics** — Trend analysis, predictive PAR modeling, peer benchmarking.
- [ ] **API for third-party integrations** — Mobile money (MTN MoMo, Vodafone Cash), core banking, credit bureaus.
- [ ] **White-labeling** — Allow MFIs to customize branding, colors, and logos.
- [ ] **Multi-branch support** — Larger MFIs operate across multiple branches with branch-level reporting.

---

## Current Build Status

| Check | Status | Notes |
|-------|--------|-------|
| `npm run build` | **PASS** | Compiles successfully, 1.86 MB bundle |
| `npm run lint` | **FAIL** | ESLint config references missing `@eslint/js` package |
| `npm audit` | **6 vulnerabilities** | 4 moderate, 2 high — all fixable |
| Tests | **NONE** | Zero test files exist |
| TypeScript | **PASS** | No type errors in build |
| PWA | **CONFIGURED** | Service worker + manifest generated |

---

## Estimated Effort by Priority

| Priority | Items | Estimate |
|----------|-------|----------|
| **Critical** (blockers) | 16 items | Largest effort — security + testing foundation |
| **High** (should-fix) | 14 items | Feature completion + infrastructure |
| **Medium** (around launch) | 13 items | Documentation + compliance + performance |
| **Low** (post-launch) | 4 items | Enhancements |

**Bottom line:** The app has strong bones — well-structured code, good feature coverage, and solid UI. The gaps are in the _invisible infrastructure_ that separates a demo from a production financial system: security hardening, testing, monitoring, and compliance verification.
