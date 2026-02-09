# 🏦 MFI Clarity — User Guide

> **The Complete Microfinance Management Platform for Africa**
> Regulatory-compliant · Offline-capable · Multi-country ready

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Executive Dashboard](#-executive-dashboard)
3. [Client Management](#-client-management)
4. [Loan Management](#-loan-management)
5. [Repayments & Collections](#-repayments--collections)
6. [Field Operations (Offline)](#-field-operations-offline)
7. [Regulatory Compliance](#-regulatory-compliance)
8. [Financial Reports](#-financial-reports)
9. [Board & Investor Views](#-board--investor-views)
10. [Department Reports](#-department-reports)
11. [User Management & Roles](#-user-management--roles)
12. [Settings & Configuration](#%EF%B8%8F-settings--configuration)
13. [Offline Sync & Conflict Resolution](#-offline-sync--conflict-resolution)
14. [Sales Demo (Multi-Country)](#-sales-demo-multi-country)
15. [Quick Reference](#-quick-reference)

---

## 🚀 Getting Started

### Step 1: Activate Your License

Navigate to **`/activate`** and enter the license key provided by your MFI Clarity account manager.

| License Tier | Max Users | Features |
|:------------|:----------|:---------|
| 🟢 **Starter** | 5 | Core loan & client management |
| 🔵 **Pro** | 25 | Full regulatory + financial reports |
| 🟣 **Enterprise** | Unlimited | All features + priority support |

### Step 2: Register Your Account

After license activation, you'll create your staff login:

- **Full Name** — Your display name
- **Email** — Your work email (used for login)
- **Password** — Minimum 6 characters

> 📧 Check your inbox for a confirmation email before signing in.

### Step 3: Set Up Your Organisation

On first login, complete the Organisation Onboarding form:

| Field | Description |
|:------|:------------|
| Organisation Name | Official registered name |
| Trading Name | Name used in daily business |
| Registration Number | Business registration ID |
| Tax ID (TIN) | Tax identification number |
| Region & Address | Physical location details |
| Phone & Email | Organisation contact info |

After onboarding, you'll land on the **Executive Dashboard** — your daily command centre.

---

## 📊 Executive Dashboard

> **Route:** `/` (Home)

Your real-time portfolio health at a glance.

### KPI Cards (Click any card to drill down!)

| Card | What It Shows | Why It Matters |
|:-----|:-------------|:---------------|
| 💰 **Gross Portfolio** | Total outstanding principal | Size of your lending book |
| 📋 **Active Loans** | Number of disbursed loans | Operational scale |
| ⚠️ **PAR 30+** | Portfolio at Risk (30+ days overdue) | Credit quality indicator |
| 🏦 **Provisions Required** | Required loan loss provisions | Regulatory buffer needed |

### Classification Table

Loans are automatically classified into regulatory buckets:

| Bucket | Days Overdue | Provision Rate | Colour |
|:-------|:------------|:---------------|:-------|
| 🟢 Current | 0 | 1% | Green |
| 🟡 OLEM | 1–30 | 5% | Yellow |
| 🟠 Substandard | 31–90 | 25% | Orange |
| 🔴 Doubtful | 91–180 | 50% | Red |
| ⬛ Loss | 180+ | 100% | Dark Red |

> 💡 **Tip:** Click any KPI card to see the detailed drilldown — including calculation formula, data source, and the individual loans that make up the number.

---

## 👥 Client Management

> **Route:** `/data-entry` → **Clients** tab or **New Client** tab

### Creating a New Client

Navigate to **Data Entry → New Client** and select the client type:

| Type | Use For |
|:-----|:--------|
| 👤 **Individual** | Single person borrower |
| 👥 **Group** | Solidarity/village banking groups |
| 🤝 **Cooperative** | Registered cooperatives |
| 🏢 **SME** | Small & medium enterprises |

### Required KYC Fields

These fields are **mandatory** per regulatory guidelines:

| Field | Description | Example |
|:------|:------------|:--------|
| First Name | As on ID document | Kwame |
| Last Name | As on ID document | Mensah |
| ID Number | National identity number | GHA-123456789-0 |
| ID Expiry | Document expiration date | 2028-06-15 |
| Date of Birth | From ID document | 1985-03-20 |
| Gender | M or F | M |
| Nationality | Country of citizenship | Ghanaian |
| Occupation | Current employment | Market Trader |
| Risk Category | LOW / MEDIUM / HIGH | LOW |
| Source of Funds | How income is generated | Business profits |

### Optional Fields

- 📞 Phone number
- 📧 Email address
- 🏠 Physical address & proof of residence
- 💼 Business details (name, type, years, income, expenses)

### Searching for Clients

Use the search bar on the **Clients** tab to find clients by:
- Name
- ID number
- Phone number
- Group name

---

## 💳 Loan Management

> **Route:** `/data-entry` → **Loan** tab

### Creating a New Loan

| Step | What You Enter |
|:-----|:--------------|
| 1️⃣ **Select Client** | Search and select the borrower |
| 2️⃣ **Loan Category** | Agriculture, Trade, Housing, etc. |
| 3️⃣ **Loan Product** | Filtered by category |
| 4️⃣ **Principal** | Amount to disburse (100 – 5,000,000) |
| 5️⃣ **Term** | Duration in months (1 – 240) |
| 6️⃣ **Interest Rate** | Annual rate (default: 30%) |
| 7️⃣ **Interest Method** | FLAT or REDUCING BALANCE |
| 8️⃣ **Repayment Frequency** | Daily / Weekly / Fortnightly / Monthly |
| 9️⃣ **Penalty Settings** | Type, value, and grace days |
| 🔟 **Purpose** | Detailed description of loan use |

### Built-in Calculators

The loan form includes three powerful tools:

| Calculator | What It Does |
|:-----------|:-------------|
| 🧮 **Loan Calculator** | Shows monthly payment, total interest, total repayable |
| ✅ **Affordability Check** | Validates income vs. expenses vs. repayment capacity |
| 📅 **Amortization Schedule** | Month-by-month breakdown of principal & interest |

### Affordability Result

| Result | Meaning | Conditions |
|:-------|:--------|:-----------|
| 🟢 **APPROVED** | Client can comfortably repay | DTI ≤ 30%, Safety Cushion ≥ 20% |
| 🟡 **CAUTION** | Borderline — review carefully | DTI ≤ 40%, Safety Cushion ≥ 10% |
| 🔴 **REJECTED** | Client cannot afford this loan | DTI > 40% or Safety Cushion < 10% |

### Loan Workflow

After submission, loans follow this lifecycle:

```
📝 Application → 🔍 Assessment → ✅ Approval → 💰 Disbursement → 📊 Active → ✔️ Completed
                                    ↓
                              ❌ Rejected
```

---

## 💵 Repayments & Collections

### Recording a Repayment

> **Route:** `/data-entry` → **Repayment** tab

| Field | Description |
|:------|:------------|
| Loan ID | Select from active loans |
| Amount | Payment amount received |
| Payment Date | Date of collection (default: today) |
| Reference | Auto-generated unique ID |

### Repayment Trends

> **Route:** `/repayments`

View a **60-day rolling trend** of collections:

- 📈 **Area chart** showing daily collection totals
- 💰 **Total Collected** over the period
- 📊 **Payment Count** and **Average Daily Collection**
- 📥 **Export** to CSV or PDF

---

## 📱 Field Operations (Offline)

> **Route:** `/field-operations`

Designed for loan officers working in the field — **works even without internet**.

### Three Tabs

| Tab | Purpose |
|:----|:--------|
| 📋 **Collections Queue** | Clients due for collection today |
| ➕ **New Collection** | Record a field collection with evidence |
| 📜 **All History** | Past collections with verification status |

### Recording a Field Collection

The collection form captures everything needed for audit:

| Feature | Details |
|:--------|:--------|
| 👤 **Client & Loan** | Select client, then their active loan |
| 💰 **Amount & Method** | Cash, Mobile Money, or Bank Transfer |
| 📍 **GPS Location** | Auto-capture with accuracy indicator |
| 📸 **Receipt Photo** | Camera capture or file upload |
| ✍️ **Digital Signature** | Client signs on-screen |
| 📝 **Notes** | Additional comments |

> 🔌 **Offline Mode:** If you lose internet connection, collections are saved locally and automatically sync when you're back online. Look for the network indicator in the top-right corner.

---

## 🏛️ Regulatory Compliance

> **Route:** `/regulatory-reports`

### Overview

The compliance dashboard shows your institution's status at a glance with the **Tier Compliance Widget** at the top.

### Five Tabs

#### 1️⃣ Capital Adequacy Ratio (CAR)

| Component | Description |
|:----------|:------------|
| Tier I Capital | Paid-up capital + reserves – deductions |
| Tier II Capital | Revaluation reserves + subordinated debt (capped at Tier I) |
| Risk-Weighted Assets | Assets weighted by risk category (0%–100%) |
| **CAR = Capital ÷ RWA** | Must be ≥ minimum (varies by tier) |

#### 2️⃣ Liquidity Ratio

```
Liquidity Ratio = Liquid Assets ÷ Current Liabilities × 100
```

Must meet the minimum threshold set by your regulator.

#### 3️⃣ Loan Classification

Automatic classification of your entire portfolio into regulatory buckets with provisioning calculations.

#### 4️⃣ Prudential Returns

Track filing deadlines and submission status for regulatory reports.

#### 5️⃣ AML/CFT Compliance

Anti-money laundering monitoring and reporting requirements.

---

## 📑 Financial Reports

> **Route:** `/financial-reports`

### Five Tabs

| Tab | Contents |
|:----|:---------|
| 📊 **Financial Statements** | Balance Sheet, Profit & Loss, Cash Flow |
| 💹 **Profitability** | ROA, ROE, Net Margin, Yield on Assets |
| 📉 **PAR Analysis** | Portfolio aging by classification + trends |
| 🏦 **Deposits** | Deposit sources, maturities, concentration monitoring |
| 🛡️ **Governance** | Risk indicators, stress tests, concentration risk |

### Key Ratios Tracked

| Ratio | Formula | Good Benchmark |
|:------|:--------|:---------------|
| Net Interest Margin | (Interest Income – Interest Expense) ÷ Avg Assets | > 8% |
| Operational Self-Sufficiency | Operating Revenue ÷ Operating Expenses | > 120% |
| Return on Assets (ROA) | Net Income ÷ Total Assets | > 2% |
| Return on Equity (ROE) | Net Income ÷ Total Equity | > 15% |
| Cost-to-Income | Operating Expenses ÷ Operating Revenue | < 70% |

---

## 🎯 Board & Investor Views

### Board Dashboard

> **Route:** `/board`

Strategic-level reporting for board members with **period selection** (Weekly / Monthly / Quarterly):

| Tab | What Board Members See |
|:----|:----------------------|
| 📋 **Executive Summary** | High-level financial overview for the selected period |
| 📈 **Strategic KPIs** | Long-term trend metrics and targets |
| ⚠️ **Risk Analysis** | Credit, liquidity, and operational risk assessment |
| 📊 **Trends & Peers** | Quarterly performance charts + industry comparison |

### Investor / Shareholder Portal

> **Route:** `/shareholders`

| Feature | Description |
|:--------|:------------|
| 💼 **My Portfolio** | Individual shareholding, value, dividends |
| 📊 **Portfolio Summary** | All shareholders' holdings (admin only) |
| 💰 **Dividend Management** | Record and process dividend payments (admin) |
| 📈 **Performance Charts** | Allocation, trends, and returns |

---

## 🏢 Department Reports

> **Route:** `/departments`

Deep analytics by department with period selection (Daily / Weekly / Monthly / Quarterly).

### Three Departments

| Department | Key Metrics |
|:-----------|:------------|
| 🧮 **Accounts** | Total Assets, Liabilities, Equity, Income, Expenses, Net Income, GL Summary, Trial Balance |
| 💰 **Collections** | Recovery rate, collector performance, daily trends |
| 📋 **Credit** | Approval rate, rejection analysis, officer scorecards, pipeline status, product performance |

---

## 👤 User Management & Roles

> **Route:** `/user-management`

### Staff Roles

| Role | Access Level |
|:-----|:------------|
| 🔴 **Admin** | Full access — settings, users, all reports |
| 🟠 **Manager** | Dashboards, reports, limited user management |
| 🟡 **Credit Officer** | Loan applications, approvals, client management |
| 🟢 **Collections Officer** | Repayments, field operations, collector tracking |
| 🔵 **Collector** | Field operations only — collections, GPS, signatures |
| ⚪ **Viewer** | Read-only access to dashboards |

### Client Assignments

- Assign specific clients to field staff
- Collectors see only their assigned clients
- Helps manage workload distribution

---

## ⚙️ Settings & Configuration

> **Route:** `/settings`

### Organisation Tab

Edit your institution's details:
- Organisation name & trading name
- Physical address, region, postal code
- Phone, email, website

### Compliance Tab

Configure your regulatory parameters:

| Setting | Description | Example |
|:--------|:------------|:--------|
| Institution Tier | Your regulatory classification | Tier 4 — MFC |
| CAR Threshold | Minimum capital adequacy ratio | 10% |
| Liquidity Threshold | Minimum liquidity ratio | 15% |
| Max Loan per Borrower | Lending cap per client | 50,000 |
| Single Obligor Limit | Max exposure to one client (% of net worth) | 10% |

---

## 🔄 Offline Sync & Conflict Resolution

### How Offline Mode Works

```
📱 Field Officer goes offline
       ↓
💾 Data saved to device (IndexedDB)
       ↓
🔄 Auto-queued for sync
       ↓
📶 Internet reconnects
       ↓
☁️ Data syncs to server automatically
       ↓
✅ Confirmation shown
```

### Sync Order

Data syncs in dependency order to maintain integrity:

```
1. Clients   →  2. Loans   →  3. Repayments   →  4. Field Collections
```

### Conflict Resolution

> **Route:** `/sync-conflicts`

When a conflict occurs (e.g., same client created on two devices):

| Resolution | What Happens |
|:-----------|:-------------|
| 🏠 **Keep Local** | Your offline version overwrites the server |
| ☁️ **Keep Server** | The server version is kept, local discarded |

### Network Status Indicator

Look for the indicator in the **top-right corner**:

| Icon | Meaning |
|:-----|:--------|
| 🟢 **Green** | Online — data syncs in real time |
| 🔴 **Red** | Offline — data saved locally |

---

## 🌍 Sales Demo (Multi-Country)

> **Route:** `/sales`

### For Potential Buyers

The sales demo showcases MFI Clarity to prospective buyers from any African country.

### Supported Regulatory Frameworks

| Country/Region | Regulator | Currency | CAR Min | Language |
|:---------------|:----------|:---------|:--------|:---------|
| 🇬🇭 Ghana | Bank of Ghana (BoG) | GHS (₵) | 10% | English |
| 🏦 WAEMU Zone | BCEAO | XOF (FCFA) | 8% | Français |
| 🇰🇪 Kenya | Central Bank (CBK) | KES (KSh) | 14.5% | English |

### What the Demo Shows

1. **Country Selector** — Pick a regulatory framework
2. **Regulatory Comparison** — CAR, liquidity, AML framework side-by-side
3. **Classification Buckets** — Each country's loan classification with provision rates
4. **Institution Tiers** — Minimum capital, lending limits per tier
5. **Feature Showcase** — All platform capabilities in the selected language
6. **Live Demo Access** — Explore the full app with sample data

> 🌐 **Auto-language:** Selecting BCEAO automatically switches to French.

### Adding a New Country

When you close a deal with a new market, the onboarding process is:

```
1. Define the country's regulatory config (classification, CAR, tiers)
2. Add to the registry
3. Add translations (if needed)
4. Create country-specific chart of accounts
5. Deploy — the app adapts automatically
```

---

## 📌 Quick Reference

### Keyboard Shortcuts

| Key | Action |
|:----|:-------|
| `Tab` | Navigate between form fields |
| `Enter` | Submit forms |
| `Esc` | Close modals and dialogs |
| Type to search | Filter dropdowns as you type |

### Export Options

| Data | Formats | Location |
|:-----|:--------|:---------|
| Portfolio Aging | CSV, PDF | Portfolio Ageing page |
| Repayments | CSV, PDF | Repayments page |
| Department Reports | CSV | Department Reports page |
| Client Documents | Individual files | Data Entry → Find Docs |
| Audit Trail | CSV | Audit Trail page |

### URL Quick Links

| Page | URL |
|:-----|:----|
| Dashboard | `/` |
| Data Entry | `/data-entry` |
| Field Operations | `/field-operations` |
| Regulatory Reports | `/regulatory-reports` |
| Financial Reports | `/financial-reports` |
| Settings | `/settings` |
| Sales Demo | `/sales` |

### Support

- 📧 Contact your MFI Clarity administrator
- 🐛 Report issues via your account manager
- 📖 This guide is available at `USER_GUIDE.md` in the project root

---

> **MFI Clarity** — Built for Africa's microfinance institutions.
> Regulatory-compliant. Offline-capable. Multi-country ready.

*© 2026 MFI Clarity. All rights reserved.*
