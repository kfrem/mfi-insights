-- ============================================================================
-- ACCOUNTING INFRASTRUCTURE for MFI Clarity
-- ============================================================================
-- Creates: chart_of_accounts, journal_entries, journal_entry_lines,
--          fiscal_periods, deposits
-- Includes: RLS, seed chart of accounts for Ghanaian MFIs, helper functions
-- ============================================================================

-- ─── 1. Chart of Accounts ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  account_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organisations(org_id),
  account_code   TEXT NOT NULL,
  account_name   TEXT NOT NULL,
  account_type   TEXT NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
  account_subtype TEXT NOT NULL CHECK (account_subtype IN (
    'CURRENT_ASSET','NON_CURRENT_ASSET',
    'CURRENT_LIABILITY','NON_CURRENT_LIABILITY',
    'EQUITY',
    'INTEREST_INCOME','OTHER_INCOME',
    'INTEREST_EXPENSE','PROVISION_EXPENSE','OPERATING_EXPENSE','TAX_EXPENSE'
  )),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT','CREDIT')),
  -- Report mapping: identifies which field in BalanceSheet/IncomeStatement this maps to
  report_mapping TEXT NOT NULL,
  -- Regulatory tagging
  car_category   TEXT CHECK (car_category IN (
    'TIER_I_CAPITAL','TIER_I_DEDUCTION','TIER_II_CAPITAL',
    'RWA_0','RWA_20','RWA_50','RWA_100'
  )),
  liquidity_category TEXT CHECK (liquidity_category IN ('LIQUID_ASSET','CURRENT_LIABILITY')),
  -- Metadata
  parent_account_id UUID REFERENCES chart_of_accounts(account_id),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_system      BOOLEAN NOT NULL DEFAULT FALSE,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, account_code)
);

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coa_select" ON chart_of_accounts FOR SELECT
  USING (user_belongs_to_org(auth.uid(), org_id));
CREATE POLICY "coa_insert" ON chart_of_accounts FOR INSERT
  WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "coa_update" ON chart_of_accounts FOR UPDATE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "coa_delete" ON chart_of_accounts FOR DELETE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id) AND NOT is_system);

-- ─── 2. Journal Entries ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  entry_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organisations(org_id),
  entry_number   SERIAL,
  entry_date     DATE NOT NULL,
  description    TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN (
    'MANUAL','LOAN_DISBURSEMENT','REPAYMENT','FEE_CHARGE',
    'INTEREST_ACCRUAL','PROVISION','DEPRECIATION','SALARY',
    'DEPOSIT','WITHDRAWAL','TRANSFER','ADJUSTMENT','OPENING_BALANCE'
  )),
  reference_id   UUID,
  status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED')),
  posted_by      UUID REFERENCES auth.users(id),
  posted_at      TIMESTAMPTZ,
  reversed_by    UUID REFERENCES auth.users(id),
  reversed_at    TIMESTAMPTZ,
  reversal_of    UUID REFERENCES journal_entries(entry_id),
  created_by     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "je_select" ON journal_entries FOR SELECT
  USING (user_belongs_to_org(auth.uid(), org_id));
CREATE POLICY "je_insert" ON journal_entries FOR INSERT
  WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "je_update" ON journal_entries FOR UPDATE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
-- No delete — journal entries are reversed, never deleted

-- ─── 3. Journal Entry Lines ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  line_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id       UUID NOT NULL REFERENCES journal_entries(entry_id),
  org_id         UUID NOT NULL REFERENCES organisations(org_id),
  account_id     UUID NOT NULL REFERENCES chart_of_accounts(account_id),
  debit_amount   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  description    TEXT,
  CHECK (debit_amount > 0 OR credit_amount > 0),
  CHECK (NOT (debit_amount > 0 AND credit_amount > 0))
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jel_select" ON journal_entry_lines FOR SELECT
  USING (user_belongs_to_org(auth.uid(), org_id));
CREATE POLICY "jel_insert" ON journal_entry_lines FOR INSERT
  WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "jel_update" ON journal_entry_lines FOR UPDATE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ─── 4. Fiscal Periods ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fiscal_periods (
  period_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(org_id),
  period_name  TEXT NOT NULL,
  period_type  TEXT NOT NULL CHECK (period_type IN ('MONTHLY','QUARTERLY','YEARLY')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','LOCKED')),
  closed_by    UUID REFERENCES auth.users(id),
  closed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, period_type, start_date),
  CHECK (end_date > start_date)
);

ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_select" ON fiscal_periods FOR SELECT
  USING (user_belongs_to_org(auth.uid(), org_id));
CREATE POLICY "fp_insert" ON fiscal_periods FOR INSERT
  WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "fp_update" ON fiscal_periods FOR UPDATE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ─── 5. Deposits ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deposits (
  deposit_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(org_id),
  client_id     UUID NOT NULL REFERENCES clients(client_id),
  deposit_type  TEXT NOT NULL CHECK (deposit_type IN ('DEMAND','TIME','SAVINGS')),
  balance       NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  maturity_date DATE,
  opened_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','MATURED','CLOSED','DORMANT')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dep_select" ON deposits FOR SELECT
  USING (user_belongs_to_org(auth.uid(), org_id));
CREATE POLICY "dep_insert" ON deposits FOR INSERT
  WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));
CREATE POLICY "dep_update" ON deposits FOR UPDATE
  USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ─── 6. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX idx_coa_org_type ON chart_of_accounts(org_id, account_type);
CREATE INDEX idx_coa_org_code ON chart_of_accounts(org_id, account_code);
CREATE INDEX idx_je_org_date ON journal_entries(org_id, entry_date);
CREATE INDEX idx_je_org_status ON journal_entries(org_id, status);
CREATE INDEX idx_jel_entry ON journal_entry_lines(entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_org ON journal_entry_lines(org_id);
CREATE INDEX idx_fp_org_type ON fiscal_periods(org_id, period_type);
CREATE INDEX idx_dep_org_client ON deposits(org_id, client_id);
CREATE INDEX idx_dep_org_status ON deposits(org_id, status);

-- ─── 7. Journal Entry Balance Validation Trigger ────────────────────────────
-- Ensures every posted journal entry has equal debits and credits

CREATE OR REPLACE FUNCTION check_journal_entry_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_debits NUMERIC(15,2);
  total_credits NUMERIC(15,2);
BEGIN
  -- Only check when posting
  IF NEW.status = 'POSTED' AND (OLD.status IS NULL OR OLD.status = 'DRAFT') THEN
    SELECT
      COALESCE(SUM(debit_amount), 0),
      COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM journal_entry_lines
    WHERE entry_id = NEW.entry_id;

    IF total_debits != total_credits THEN
      RAISE EXCEPTION 'Journal entry is unbalanced: debits (%) != credits (%)',
        total_debits, total_credits;
    END IF;

    IF total_debits = 0 THEN
      RAISE EXCEPTION 'Journal entry has no lines';
    END IF;

    -- Auto-set posted fields
    NEW.posted_at := now();
    NEW.posted_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_je_balance
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_entry_balance();

-- ─── 8. Trial Balance RPC ───────────────────────────────────────────────────
-- Returns all account balances as of a given date for an organisation

CREATE OR REPLACE FUNCTION get_trial_balance(
  p_org_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  account_subtype TEXT,
  normal_balance TEXT,
  report_mapping TEXT,
  car_category TEXT,
  liquidity_category TEXT,
  total_debits NUMERIC,
  total_credits NUMERIC,
  balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    coa.account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.account_subtype,
    coa.normal_balance,
    coa.report_mapping,
    coa.car_category,
    coa.liquidity_category,
    COALESCE(SUM(jel.debit_amount), 0) AS total_debits,
    COALESCE(SUM(jel.credit_amount), 0) AS total_credits,
    CASE coa.normal_balance
      WHEN 'DEBIT' THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
      WHEN 'CREDIT' THEN COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END AS balance
  FROM chart_of_accounts coa
  LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.entry_id = jel.entry_id
    AND je.status = 'POSTED'
    AND je.entry_date <= p_as_of_date
  WHERE coa.org_id = p_org_id
    AND coa.is_active = TRUE
  GROUP BY coa.account_id, coa.account_code, coa.account_name,
           coa.account_type, coa.account_subtype, coa.normal_balance,
           coa.report_mapping, coa.car_category, coa.liquidity_category
  ORDER BY coa.account_code;
END;
$$;

-- ─── 9. Period Movements RPC ────────────────────────────────────────────────
-- Returns income/expense account movements for a date range

CREATE OR REPLACE FUNCTION get_period_movements(
  p_org_id UUID,
  p_from_date DATE,
  p_to_date DATE
)
RETURNS TABLE (
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  account_subtype TEXT,
  report_mapping TEXT,
  total_debits NUMERIC,
  total_credits NUMERIC,
  net_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    coa.account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.account_subtype,
    coa.report_mapping,
    COALESCE(SUM(jel.debit_amount), 0) AS total_debits,
    COALESCE(SUM(jel.credit_amount), 0) AS total_credits,
    CASE coa.normal_balance
      WHEN 'DEBIT' THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
      WHEN 'CREDIT' THEN COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END AS net_amount
  FROM chart_of_accounts coa
  LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.entry_id = jel.entry_id
    AND je.status = 'POSTED'
    AND je.entry_date BETWEEN p_from_date AND p_to_date
  WHERE coa.org_id = p_org_id
    AND coa.is_active = TRUE
    AND coa.account_type IN ('INCOME', 'EXPENSE')
  GROUP BY coa.account_id, coa.account_code, coa.account_name,
           coa.account_type, coa.account_subtype, coa.normal_balance,
           coa.report_mapping
  ORDER BY coa.account_code;
END;
$$;

-- ─── 10. Seed Default Chart of Accounts ─────────────────────────────────────
-- This function is called during org onboarding to populate the standard
-- BoG-aligned chart of accounts for a new MFI.

CREATE OR REPLACE FUNCTION seed_chart_of_accounts(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ── ASSETS ──────────────────────────────────────────────────────────
  -- Current Assets
  INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, account_subtype, normal_balance, report_mapping, car_category, liquidity_category, is_system, description) VALUES
  (p_org_id, '1100', 'Cash on Hand',            'ASSET', 'CURRENT_ASSET', 'DEBIT', 'CASH_ON_HAND',            'RWA_0',  'LIQUID_ASSET', TRUE, 'Physical cash held at branches'),
  (p_org_id, '1110', 'Cash at Bank',            'ASSET', 'CURRENT_ASSET', 'DEBIT', 'CASH_AT_BANK',            'RWA_20', 'LIQUID_ASSET', TRUE, 'Bank account balances'),
  (p_org_id, '1200', 'Short-term Investments',  'ASSET', 'CURRENT_ASSET', 'DEBIT', 'SHORT_TERM_INVESTMENTS',  'RWA_0',  'LIQUID_ASSET', TRUE, 'T-bills, GoG securities < 1yr'),
  (p_org_id, '1300', 'Gross Loan Portfolio',    'ASSET', 'CURRENT_ASSET', 'DEBIT', 'GROSS_LOAN_PORTFOLIO',    'RWA_100', NULL,          TRUE, 'Total outstanding loan principal'),
  (p_org_id, '1310', 'Loan Loss Provisions',    'ASSET', 'CURRENT_ASSET', 'CREDIT','LOAN_LOSS_PROVISIONS',     NULL,      NULL,          TRUE, 'Contra-asset: accumulated provisions'),
  (p_org_id, '1400', 'Interest Receivable',     'ASSET', 'CURRENT_ASSET', 'DEBIT', 'INTEREST_RECEIVABLE',     'RWA_100', NULL,          TRUE, 'Accrued interest not yet collected'),
  (p_org_id, '1410', 'Other Receivables',       'ASSET', 'CURRENT_ASSET', 'DEBIT', 'OTHER_RECEIVABLES',       'RWA_100', NULL,          TRUE, 'Staff advances, other receivables'),
  (p_org_id, '1420', 'Prepaid Expenses',        'ASSET', 'CURRENT_ASSET', 'DEBIT', 'PREPAID_EXPENSES',        'RWA_100', NULL,          TRUE, 'Insurance, rent paid in advance'),

  -- Non-Current Assets
  (p_org_id, '1500', 'Property, Plant & Equipment', 'ASSET', 'NON_CURRENT_ASSET', 'DEBIT', 'PPE',                     'RWA_100', NULL, TRUE, 'Buildings, vehicles, equipment'),
  (p_org_id, '1510', 'Accumulated Depreciation',    'ASSET', 'NON_CURRENT_ASSET', 'CREDIT','ACCUMULATED_DEPRECIATION', NULL,      NULL, TRUE, 'Contra-asset: total depreciation'),
  (p_org_id, '1600', 'Intangible Assets',            'ASSET', 'NON_CURRENT_ASSET', 'DEBIT', 'INTANGIBLE_ASSETS',       'RWA_100', NULL, TRUE, 'Software, licenses, goodwill'),
  (p_org_id, '1700', 'Long-term Investments',        'ASSET', 'NON_CURRENT_ASSET', 'DEBIT', 'LONG_TERM_INVESTMENTS',   'RWA_100', NULL, TRUE, 'Investments > 1 year'),
  (p_org_id, '1800', 'Deferred Tax Assets',          'ASSET', 'NON_CURRENT_ASSET', 'DEBIT', 'DEFERRED_TAX_ASSETS',     'RWA_100', NULL, TRUE, 'Future tax benefits');

  -- ── LIABILITIES ─────────────────────────────────────────────────────
  -- Current Liabilities
  INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, account_subtype, normal_balance, report_mapping, car_category, liquidity_category, is_system, description) VALUES
  (p_org_id, '2100', 'Deposits from Public',    'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'DEPOSITS_FROM_PUBLIC',    NULL, 'CURRENT_LIABILITY', TRUE, 'Client savings and demand deposits'),
  (p_org_id, '2200', 'Short-term Borrowings',   'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'SHORT_TERM_BORROWINGS',   NULL, 'CURRENT_LIABILITY', TRUE, 'Credit lines, overdrafts < 1yr'),
  (p_org_id, '2300', 'Accounts Payable',        'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'ACCOUNTS_PAYABLE',        NULL, 'CURRENT_LIABILITY', TRUE, 'Supplier invoices, trade payables'),
  (p_org_id, '2310', 'Accrued Expenses',        'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'ACCRUED_EXPENSES',        NULL, 'CURRENT_LIABILITY', TRUE, 'Salaries, utilities, rent owing'),
  (p_org_id, '2320', 'Interest Payable',        'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'INTEREST_PAYABLE',        NULL, 'CURRENT_LIABILITY', TRUE, 'Interest owed on borrowings/deposits'),
  (p_org_id, '2330', 'Taxes Payable',           'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'TAXES_PAYABLE',           NULL, 'CURRENT_LIABILITY', TRUE, 'Corporate tax, withholding tax'),
  (p_org_id, '2340', 'Deferred Income',         'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 'DEFERRED_INCOME',         NULL, 'CURRENT_LIABILITY', TRUE, 'Fees received but not yet earned'),

  -- Non-Current Liabilities
  (p_org_id, '2500', 'Long-term Borrowings',          'LIABILITY', 'NON_CURRENT_LIABILITY', 'CREDIT', 'LONG_TERM_BORROWINGS',        NULL, NULL, TRUE, 'Loans from banks/DFIs > 1yr'),
  (p_org_id, '2510', 'Subordinated Debt',              'LIABILITY', 'NON_CURRENT_LIABILITY', 'CREDIT', 'SUBORDINATED_DEBT',            NULL, NULL, TRUE, 'Qualifies as Tier II capital (with limits)'),
  (p_org_id, '2600', 'Deferred Tax Liabilities',       'LIABILITY', 'NON_CURRENT_LIABILITY', 'CREDIT', 'DEFERRED_TAX_LIABILITIES',     NULL, NULL, TRUE, 'Future tax obligations'),
  (p_org_id, '2700', 'Other Long-term Liabilities',    'LIABILITY', 'NON_CURRENT_LIABILITY', 'CREDIT', 'OTHER_LT_LIABILITIES',         NULL, NULL, TRUE, 'Other obligations > 1yr');

  -- ── EQUITY ──────────────────────────────────────────────────────────
  INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, account_subtype, normal_balance, report_mapping, car_category, liquidity_category, is_system, description) VALUES
  (p_org_id, '3100', 'Paid-up Capital',       'EQUITY', 'EQUITY', 'CREDIT', 'PAID_UP_CAPITAL',       'TIER_I_CAPITAL',    NULL, TRUE, 'Share capital fully paid'),
  (p_org_id, '3110', 'Share Premium',          'EQUITY', 'EQUITY', 'CREDIT', 'SHARE_PREMIUM',         'TIER_I_CAPITAL',    NULL, TRUE, 'Excess over par value'),
  (p_org_id, '3200', 'Statutory Reserves',     'EQUITY', 'EQUITY', 'CREDIT', 'STATUTORY_RESERVES',    'TIER_I_CAPITAL',    NULL, TRUE, 'BoG-mandated reserve fund'),
  (p_org_id, '3210', 'General Reserves',       'EQUITY', 'EQUITY', 'CREDIT', 'GENERAL_RESERVES',      'TIER_I_CAPITAL',    NULL, TRUE, 'Undistributed appropriated earnings'),
  (p_org_id, '3300', 'Revaluation Reserves',   'EQUITY', 'EQUITY', 'CREDIT', 'REVALUATION_RESERVES',  'TIER_II_CAPITAL',   NULL, TRUE, 'Asset revaluation surplus'),
  (p_org_id, '3400', 'Retained Earnings',      'EQUITY', 'EQUITY', 'CREDIT', 'RETAINED_EARNINGS',     'TIER_I_CAPITAL',    NULL, TRUE, 'Cumulative undistributed profit');

  -- ── INCOME ──────────────────────────────────────────────────────────
  INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, account_subtype, normal_balance, report_mapping, car_category, liquidity_category, is_system, description) VALUES
  (p_org_id, '4100', 'Interest on Loans (Cash)',    'INCOME', 'INTEREST_INCOME', 'CREDIT', 'INT_ON_LOANS_CASH',    NULL, NULL, TRUE, 'Cash-basis interest collected'),
  (p_org_id, '4110', 'Interest on Loans (Accrued)', 'INCOME', 'INTEREST_INCOME', 'CREDIT', 'INT_ON_LOANS_ACCRUED', NULL, NULL, TRUE, 'Accrual-basis interest earned'),
  (p_org_id, '4200', 'Interest on Investments',     'INCOME', 'INTEREST_INCOME', 'CREDIT', 'INT_ON_INVESTMENTS',   NULL, NULL, TRUE, 'T-bills, bonds, deposit interest'),
  (p_org_id, '4210', 'Interest on Bank Deposits',   'INCOME', 'INTEREST_INCOME', 'CREDIT', 'INT_ON_BANK_DEPOSITS', NULL, NULL, TRUE, 'Savings account interest earned'),
  (p_org_id, '4300', 'Fee Income',                   'INCOME', 'OTHER_INCOME',    'CREDIT', 'FEE_INCOME',           NULL, NULL, TRUE, 'Processing fees, application fees'),
  (p_org_id, '4310', 'Commission Income',             'INCOME', 'OTHER_INCOME',    'CREDIT', 'COMMISSION_INCOME',    NULL, NULL, TRUE, 'Insurance, mobile money commissions'),
  (p_org_id, '4400', 'Forex Gains',                  'INCOME', 'OTHER_INCOME',    'CREDIT', 'FOREX_GAINS',          NULL, NULL, TRUE, 'Foreign exchange gains'),
  (p_org_id, '4500', 'Other Operating Income',       'INCOME', 'OTHER_INCOME',    'CREDIT', 'OTHER_OPERATING_INCOME', NULL, NULL, TRUE, 'Miscellaneous operating income');

  -- ── EXPENSES ────────────────────────────────────────────────────────
  INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, account_subtype, normal_balance, report_mapping, car_category, liquidity_category, is_system, description) VALUES
  (p_org_id, '5100', 'Interest on Deposits',        'EXPENSE', 'INTEREST_EXPENSE',  'DEBIT', 'INT_ON_DEPOSITS',         NULL, NULL, TRUE, 'Interest paid on client deposits'),
  (p_org_id, '5110', 'Interest on Borrowings',      'EXPENSE', 'INTEREST_EXPENSE',  'DEBIT', 'INT_ON_BORROWINGS',       NULL, NULL, TRUE, 'Interest on bank/DFI loans'),
  (p_org_id, '5120', 'Other Interest Expense',      'EXPENSE', 'INTEREST_EXPENSE',  'DEBIT', 'OTHER_INT_EXPENSE',       NULL, NULL, TRUE, 'Other financial costs'),
  (p_org_id, '5200', 'Loan Loss Provision',          'EXPENSE', 'PROVISION_EXPENSE', 'DEBIT', 'LOAN_LOSS_PROVISION',     NULL, NULL, TRUE, 'New provision charges'),
  (p_org_id, '5210', 'Provision Reversal',           'EXPENSE', 'PROVISION_EXPENSE', 'CREDIT','PROVISION_REVERSAL',      NULL, NULL, TRUE, 'Contra-expense: provision write-backs'),
  (p_org_id, '5300', 'Personnel Expenses',           'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'PERSONNEL_EXPENSES',     NULL, NULL, TRUE, 'Salaries, benefits, training'),
  (p_org_id, '5400', 'Administrative Expenses',      'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'ADMIN_EXPENSES',         NULL, NULL, TRUE, 'Office rent, utilities, supplies'),
  (p_org_id, '5500', 'Depreciation & Amortization',  'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'DEPRECIATION_AMORT',     NULL, NULL, TRUE, 'Asset depreciation charges'),
  (p_org_id, '5600', 'Other Operating Expenses',     'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'OTHER_OPERATING_EXPENSES', NULL, NULL, TRUE, 'Travel, professional fees, misc'),
  (p_org_id, '5700', 'Unverified Suspense',          'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'SUSPENSE_EXPENSES',       NULL, NULL, TRUE, 'Uncleared suspense items'),
  (p_org_id, '5800', 'Exceptional Items',            'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 'EXCEPTIONAL_ITEMS',       NULL, NULL, TRUE, 'Non-recurring items'),
  (p_org_id, '5900', 'Income Tax',                   'EXPENSE', 'TAX_EXPENSE',       'DEBIT', 'INCOME_TAX',             NULL, NULL, TRUE, 'Corporate income tax');
END;
$$;
