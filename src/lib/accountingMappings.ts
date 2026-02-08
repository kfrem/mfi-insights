/**
 * Maps report_mapping values from chart_of_accounts to the TypeScript
 * BalanceSheet and IncomeStatement interface fields.
 *
 * These mappings are used to convert a flat trial balance (from the
 * get_trial_balance / get_period_movements RPCs) into the structured
 * objects the UI expects.
 */

import type { BalanceSheet, IncomeStatement } from '@/types/financial';
import type {
  TierOneCapital,
  TierTwoCapital,
  RiskWeightedAssets,
  LiquidAssets,
  CurrentLiabilities as RegCurrentLiabilities,
} from '@/types/regulatory';

// ─── Trial Balance Row (matches RPC return shape) ───────────────────────────

export interface TrialBalanceRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  normal_balance: string;
  report_mapping: string;
  car_category: string | null;
  liquidity_category: string | null;
  total_debits: number;
  total_credits: number;
  balance: number;
}

// ─── Balance Sheet Builder ──────────────────────────────────────────────────

export function buildBalanceSheet(
  orgId: string,
  reportDate: string,
  rows: TrialBalanceRow[],
): BalanceSheet {
  const m = mapByReportMapping(rows);

  const current_assets = {
    cash_on_hand: m('CASH_ON_HAND'),
    cash_at_bank: m('CASH_AT_BANK'),
    short_term_investments: m('SHORT_TERM_INVESTMENTS'),
    gross_loan_portfolio: m('GROSS_LOAN_PORTFOLIO'),
    loan_loss_provisions: -m('LOAN_LOSS_PROVISIONS'), // contra-asset stored as positive credit balance
    net_loan_portfolio: m('GROSS_LOAN_PORTFOLIO') - m('LOAN_LOSS_PROVISIONS'),
    interest_receivable: m('INTEREST_RECEIVABLE'),
    other_receivables: m('OTHER_RECEIVABLES'),
    prepaid_expenses: m('PREPAID_EXPENSES'),
    total_current_assets: 0, // computed below
  };
  current_assets.total_current_assets =
    current_assets.cash_on_hand +
    current_assets.cash_at_bank +
    current_assets.short_term_investments +
    current_assets.net_loan_portfolio +
    current_assets.interest_receivable +
    current_assets.other_receivables +
    current_assets.prepaid_expenses;

  const non_current_assets = {
    property_plant_equipment: m('PPE'),
    accumulated_depreciation: -m('ACCUMULATED_DEPRECIATION'),
    net_fixed_assets: m('PPE') - m('ACCUMULATED_DEPRECIATION'),
    intangible_assets: m('INTANGIBLE_ASSETS'),
    long_term_investments: m('LONG_TERM_INVESTMENTS'),
    deferred_tax_assets: m('DEFERRED_TAX_ASSETS'),
    total_non_current_assets: 0,
  };
  non_current_assets.total_non_current_assets =
    non_current_assets.net_fixed_assets +
    non_current_assets.intangible_assets +
    non_current_assets.long_term_investments +
    non_current_assets.deferred_tax_assets;

  const total_assets = current_assets.total_current_assets + non_current_assets.total_non_current_assets;

  const current_liabilities = {
    deposits_from_public: m('DEPOSITS_FROM_PUBLIC'),
    short_term_borrowings: m('SHORT_TERM_BORROWINGS'),
    accounts_payable: m('ACCOUNTS_PAYABLE'),
    accrued_expenses: m('ACCRUED_EXPENSES'),
    interest_payable: m('INTEREST_PAYABLE'),
    taxes_payable: m('TAXES_PAYABLE'),
    deferred_income: m('DEFERRED_INCOME'),
    total_current_liabilities: 0,
  };
  current_liabilities.total_current_liabilities =
    current_liabilities.deposits_from_public +
    current_liabilities.short_term_borrowings +
    current_liabilities.accounts_payable +
    current_liabilities.accrued_expenses +
    current_liabilities.interest_payable +
    current_liabilities.taxes_payable +
    current_liabilities.deferred_income;

  const non_current_liabilities = {
    long_term_borrowings: m('LONG_TERM_BORROWINGS'),
    subordinated_debt: m('SUBORDINATED_DEBT'),
    deferred_tax_liabilities: m('DEFERRED_TAX_LIABILITIES'),
    other_long_term_liabilities: m('OTHER_LT_LIABILITIES'),
    total_non_current_liabilities: 0,
  };
  non_current_liabilities.total_non_current_liabilities =
    non_current_liabilities.long_term_borrowings +
    non_current_liabilities.subordinated_debt +
    non_current_liabilities.deferred_tax_liabilities +
    non_current_liabilities.other_long_term_liabilities;

  const total_liabilities =
    current_liabilities.total_current_liabilities +
    non_current_liabilities.total_non_current_liabilities;

  const equity = {
    paid_up_capital: m('PAID_UP_CAPITAL'),
    share_premium: m('SHARE_PREMIUM'),
    statutory_reserves: m('STATUTORY_RESERVES'),
    general_reserves: m('GENERAL_RESERVES'),
    revaluation_reserves: m('REVALUATION_RESERVES'),
    retained_earnings: m('RETAINED_EARNINGS'),
    current_year_profit: 0, // computed from income statement
    total_equity: 0,
  };
  equity.total_equity =
    equity.paid_up_capital +
    equity.share_premium +
    equity.statutory_reserves +
    equity.general_reserves +
    equity.revaluation_reserves +
    equity.retained_earnings +
    equity.current_year_profit;

  const total_liabilities_and_equity = total_liabilities + equity.total_equity;

  return {
    org_id: orgId,
    report_date: reportDate,
    assets: { current_assets, non_current_assets, total_assets },
    liabilities: { current_liabilities, non_current_liabilities, total_liabilities },
    equity,
    total_liabilities_and_equity,
    is_balanced: Math.abs(total_assets - total_liabilities_and_equity) < 0.01,
  };
}

// ─── Income Statement Builder ───────────────────────────────────────────────

export interface PeriodMovementRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  report_mapping: string;
  total_debits: number;
  total_credits: number;
  net_amount: number;
}

export function buildIncomeStatement(
  orgId: string,
  reportDate: string,
  period: 'monthly' | 'quarterly' | 'yearly',
  rows: PeriodMovementRow[],
): IncomeStatement {
  const m = mapByReportMapping(rows);

  const interest_on_loans_cash = m('INT_ON_LOANS_CASH');
  const interest_on_loans_accrued = m('INT_ON_LOANS_ACCRUED');
  const interest_on_investments = m('INT_ON_INVESTMENTS');
  const interest_on_bank_deposits = m('INT_ON_BANK_DEPOSITS');

  const interest_income = {
    interest_on_loans_cash,
    interest_on_loans_accrued,
    interest_on_investments,
    interest_on_bank_deposits,
    total_interest_income_cash: interest_on_loans_cash + interest_on_investments + interest_on_bank_deposits,
    total_interest_income_accrued: interest_on_loans_accrued,
    total_interest_income: interest_on_loans_cash + interest_on_loans_accrued + interest_on_investments + interest_on_bank_deposits,
  };

  const int_on_deposits = m('INT_ON_DEPOSITS');
  const int_on_borrowings = m('INT_ON_BORROWINGS');
  const other_interest_expense = m('OTHER_INT_EXPENSE');

  const interest_expense = {
    interest_on_deposits: int_on_deposits,
    interest_on_borrowings: int_on_borrowings,
    other_interest_expense,
    total_interest_expense: int_on_deposits + int_on_borrowings + other_interest_expense,
  };

  const net_interest_income = interest_income.total_interest_income - interest_expense.total_interest_expense;

  const fee_income = m('FEE_INCOME');
  const commission_income = m('COMMISSION_INCOME');
  const forex_gains = m('FOREX_GAINS');
  const other_operating_income = m('OTHER_OPERATING_INCOME');

  const other_income = {
    fee_income,
    commission_income,
    forex_gains,
    other_operating_income,
    total_other_income: fee_income + commission_income + forex_gains + other_operating_income,
  };

  const gross_operating_income = net_interest_income + other_income.total_other_income;

  const loan_loss_provision = m('LOAN_LOSS_PROVISION');
  const provision_reversal = m('PROVISION_REVERSAL');

  const provisions = {
    loan_loss_provision,
    provision_reversal,
    net_provision_expense: loan_loss_provision - provision_reversal,
  };

  const personnel_expenses = m('PERSONNEL_EXPENSES');
  const administrative_expenses = m('ADMIN_EXPENSES');
  const depreciation_amortization = m('DEPRECIATION_AMORT');
  const other_operating_expenses = m('OTHER_OPERATING_EXPENSES');
  const unverified_suspense_expenses = m('SUSPENSE_EXPENSES');

  const operating_expenses = {
    personnel_expenses,
    administrative_expenses,
    depreciation_amortization,
    other_operating_expenses,
    unverified_suspense_expenses,
    total_operating_expenses:
      personnel_expenses + administrative_expenses + depreciation_amortization +
      other_operating_expenses + unverified_suspense_expenses,
  };

  const operating_profit =
    gross_operating_income - provisions.net_provision_expense - operating_expenses.total_operating_expenses;
  const exceptional_items = m('EXCEPTIONAL_ITEMS');
  const profit_before_tax = operating_profit - exceptional_items;
  const income_tax = m('INCOME_TAX');
  const net_profit = profit_before_tax - income_tax;

  return {
    org_id: orgId,
    report_date: reportDate,
    period,
    interest_income,
    interest_expense,
    net_interest_income,
    other_income,
    gross_operating_income,
    provisions,
    operating_expenses,
    operating_profit,
    exceptional_items,
    profit_before_tax,
    income_tax,
    net_profit,
  };
}

// ─── CAR Data Builder ───────────────────────────────────────────────────────

export function buildCARInputs(rows: TrialBalanceRow[]) {
  const tier_one: TierOneCapital = {
    paid_up_capital: 0,
    statutory_reserves: 0,
    general_reserves: 0,
    special_reserves: 0,
    disclosed_reserves: 0,
    goodwill_intangibles: 0,
    losses_not_provided: 0,
    investments_subsidiaries: 0,
    investments_other_banks: 0,
    connected_lending: 0,
  };

  const tier_two: TierTwoCapital = {
    undisclosed_reserves: 0,
    revaluation_reserves: 0,
    subordinated_debt: 0,
    hybrid_capital: 0,
    deposits_for_shares: 0,
  };

  let total_assets = 0;
  let rwa_0 = 0;
  let rwa_20 = 0;
  let rwa_50 = 0;

  for (const row of rows) {
    const bal = row.balance;

    // Build RWA components from tagged accounts
    if (row.car_category === 'RWA_0') rwa_0 += bal;
    else if (row.car_category === 'RWA_20') rwa_20 += bal;
    else if (row.car_category === 'RWA_50') rwa_50 += bal;

    // Sum total assets
    if (row.account_type === 'ASSET' && row.normal_balance === 'DEBIT') {
      total_assets += bal;
    } else if (row.account_type === 'ASSET' && row.normal_balance === 'CREDIT') {
      // Contra-assets reduce total
      total_assets -= bal;
    }

    // Map equity accounts to Tier I / Tier II
    if (row.car_category === 'TIER_I_CAPITAL') {
      switch (row.report_mapping) {
        case 'PAID_UP_CAPITAL': tier_one.paid_up_capital = bal; break;
        case 'SHARE_PREMIUM': tier_one.disclosed_reserves = bal; break;
        case 'STATUTORY_RESERVES': tier_one.statutory_reserves = bal; break;
        case 'GENERAL_RESERVES': tier_one.general_reserves = bal; break;
        case 'RETAINED_EARNINGS': tier_one.disclosed_reserves += bal; break;
      }
    } else if (row.car_category === 'TIER_I_DEDUCTION') {
      // Goodwill/intangibles deducted
      tier_one.goodwill_intangibles += bal;
    } else if (row.car_category === 'TIER_II_CAPITAL') {
      switch (row.report_mapping) {
        case 'REVALUATION_RESERVES': tier_two.revaluation_reserves = bal; break;
        case 'SUBORDINATED_DEBT': tier_two.subordinated_debt = bal; break;
      }
    }
  }

  const rwa: RiskWeightedAssets = {
    total_assets,
    cash_on_hand: rwa_0,
    gog_securities: 0,
    bog_securities: 0,
    cheques_other_banks: 0,
    claims_on_banks: rwa_20,
    residential_mortgages: 0,
    export_financing: 0,
    public_institution_loans: rwa_50,
    contingent_liabilities_class1: 0,
    contingent_liabilities_class2: 0,
    net_open_position: 0,
    operational_risk_charge: 0,
  };

  return { tier_one, tier_two, rwa };
}

// ─── Liquidity Data Builder ─────────────────────────────────────────────────

export function buildLiquidityInputs(rows: TrialBalanceRow[]) {
  const liquid_assets: LiquidAssets = {
    cash_on_hand: 0,
    balances_bog: 0,
    balances_other_banks: 0,
    balances_other_fi: 0,
    gog_securities: 0,
    interbank_placements_30d: 0,
    placements_other_fi_30d: 0,
    inter_affiliate_placements: 0,
    other_liquid_assets: 0,
  };

  const current_liabilities: RegCurrentLiabilities = {
    deposits_from_public: 0,
    interbank_borrowings: 0,
    inter_affiliate_borrowings: 0,
    other_short_term_borrowings: 0,
    net_contingent_liabilities: 0,
    other_current_liabilities: 0,
  };

  for (const row of rows) {
    if (row.liquidity_category === 'LIQUID_ASSET') {
      switch (row.report_mapping) {
        case 'CASH_ON_HAND': liquid_assets.cash_on_hand = row.balance; break;
        case 'CASH_AT_BANK': liquid_assets.balances_other_banks = row.balance; break;
        case 'SHORT_TERM_INVESTMENTS': liquid_assets.gog_securities = row.balance; break;
        default: liquid_assets.other_liquid_assets += row.balance; break;
      }
    } else if (row.liquidity_category === 'CURRENT_LIABILITY') {
      switch (row.report_mapping) {
        case 'DEPOSITS_FROM_PUBLIC': current_liabilities.deposits_from_public = row.balance; break;
        case 'SHORT_TERM_BORROWINGS': current_liabilities.other_short_term_borrowings = row.balance; break;
        default: current_liabilities.other_current_liabilities += row.balance; break;
      }
    }
  }

  return { liquid_assets, current_liabilities };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapByReportMapping(rows: { report_mapping: string; balance?: number; net_amount?: number }[]) {
  const lookup = new Map<string, number>();
  for (const row of rows) {
    const val = row.balance ?? row.net_amount ?? 0;
    lookup.set(row.report_mapping, (lookup.get(row.report_mapping) ?? 0) + val);
  }
  return (key: string) => lookup.get(key) ?? 0;
}
