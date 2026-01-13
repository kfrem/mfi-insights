// Excel export utility for BoG regulatory reports
import { formatDate } from '@/lib/dateUtils';

interface ExcelColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  format?: 'currency' | 'percent' | 'number' | 'date' | 'text';
}

interface ExcelSheet<T> {
  name: string;
  data: T[];
  columns: ExcelColumn<T>[];
}

// Generate Excel-compatible XML (xlsx format requires libraries, so we use XML spreadsheet)
export function exportToExcel<T extends Record<string, any>>(
  sheets: ExcelSheet<T>[],
  filename: string
): void {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

  // Styles
  xml += '<Styles>\n';
  xml += '<Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/></Style>\n';
  xml += '<Style ss:ID="Currency"><NumberFormat ss:Format="#,##0.00"/></Style>\n';
  xml += '<Style ss:ID="Percent"><NumberFormat ss:Format="0.00%"/></Style>\n';
  xml += '<Style ss:ID="Date"><NumberFormat ss:Format="yyyy-mm-dd"/></Style>\n';
  xml += '</Styles>\n';

  for (const sheet of sheets) {
    xml += `<Worksheet ss:Name="${escapeXml(sheet.name)}">\n`;
    xml += '<Table>\n';

    // Column widths
    for (const col of sheet.columns) {
      xml += `<Column ss:Width="${col.width || 100}"/>\n`;
    }

    // Header row
    xml += '<Row>\n';
    for (const col of sheet.columns) {
      xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\n`;
    }
    xml += '</Row>\n';

    // Data rows
    for (const row of sheet.data) {
      xml += '<Row>\n';
      for (const col of sheet.columns) {
        const value = getNestedValue(row, col.key as string);
        const { type, formattedValue, styleId } = formatCellValue(value, col.format);
        xml += styleId 
          ? `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(String(formattedValue))}</Data></Cell>\n`
          : `<Cell><Data ss:Type="${type}">${escapeXml(String(formattedValue))}</Data></Cell>\n`;
      }
      xml += '</Row>\n';
    }

    xml += '</Table>\n';
    xml += '</Worksheet>\n';
  }

  xml += '</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}.xls`);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function formatCellValue(value: any, formatType?: string): { type: string; formattedValue: any; styleId?: string } {
  if (value === null || value === undefined) {
    return { type: 'String', formattedValue: '' };
  }

  switch (formatType) {
    case 'currency':
      return { type: 'Number', formattedValue: value, styleId: 'Currency' };
    case 'percent':
      return { type: 'Number', formattedValue: value / 100, styleId: 'Percent' };
    case 'number':
      return { type: 'Number', formattedValue: value };
    case 'date':
      return { type: 'String', formattedValue: value, styleId: 'Date' };
    default:
      return { type: 'String', formattedValue: String(value) };
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Specific export functions for regulatory reports
export function exportCARToExcel(car: any): void {
  const sheets = [
    {
      name: 'Tier I Capital',
      data: [
        { item: 'Paid-up Capital (Equity Shares)', amount: car.tier_one.paid_up_capital },
        { item: 'Statutory Reserves', amount: car.tier_one.statutory_reserves },
        { item: 'General Reserves', amount: car.tier_one.general_reserves },
        { item: 'Special Reserves', amount: car.tier_one.special_reserves },
        { item: 'Disclosed Reserves', amount: car.tier_one.disclosed_reserves },
        { item: 'Less: Goodwill & Intangibles', amount: -car.tier_one.goodwill_intangibles },
        { item: 'Less: Losses Not Provided For', amount: -car.tier_one.losses_not_provided },
        { item: 'Less: Investments in Subsidiaries', amount: -car.tier_one.investments_subsidiaries },
        { item: 'Less: Investments in Other Banks/FI', amount: -car.tier_one.investments_other_banks },
        { item: 'Less: Connected Lending', amount: -car.tier_one.connected_lending },
        { item: 'ADJUSTED TIER I CAPITAL', amount: car.adjusted_tier_one },
      ],
      columns: [
        { key: 'item', header: 'Item', width: 200 },
        { key: 'amount', header: 'Amount (GHS)', width: 120, format: 'currency' as const },
      ],
    },
    {
      name: 'Tier II Capital',
      data: [
        { item: 'Undisclosed Reserves', amount: car.tier_two.undisclosed_reserves },
        { item: 'Revaluation Reserves', amount: car.tier_two.revaluation_reserves },
        { item: 'Subordinated Term Debt', amount: car.tier_two.subordinated_debt },
        { item: 'Hybrid Capital', amount: car.tier_two.hybrid_capital },
        { item: 'Deposits for Shares', amount: car.tier_two.deposits_for_shares },
        { item: 'TOTAL TIER II CAPITAL', amount: car.total_tier_two },
        { item: 'CAPPED TIER II (≤100% of Tier I)', amount: car.capped_tier_two },
      ],
      columns: [
        { key: 'item', header: 'Item', width: 200 },
        { key: 'amount', header: 'Amount (GHS)', width: 120, format: 'currency' as const },
      ],
    },
    {
      name: 'CAR Summary',
      data: [
        { metric: 'Adjusted Tier I Capital', value: car.adjusted_tier_one },
        { metric: 'Capped Tier II Capital', value: car.capped_tier_two },
        { metric: 'Adjusted Capital Base', value: car.adjusted_capital_base },
        { metric: 'Risk-Weighted Assets', value: car.total_rwa },
        { metric: 'Capital Adequacy Ratio (%)', value: car.car_ratio },
        { metric: 'Minimum Requirement (%)', value: car.minimum_requirement },
        { metric: 'Compliance Status', value: car.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT' },
      ],
      columns: [
        { key: 'metric', header: 'Metric', width: 180 },
        { key: 'value', header: 'Value', width: 120 },
      ],
    },
  ];

  exportToExcel(sheets as any, `CAR-Report-${formatDate(new Date(), 'yyyy-MM-dd')}`);
}

export function exportLiquidityToExcel(liquidity: any): void {
  const sheets = [
    {
      name: 'Liquid Assets',
      data: [
        { item: 'Cash on Hand', amount: liquidity.liquid_assets.cash_on_hand },
        { item: 'Balances with BoG', amount: liquidity.liquid_assets.balances_bog },
        { item: 'Balances with Other Banks', amount: liquidity.liquid_assets.balances_other_banks },
        { item: 'Balances with Other FIs', amount: liquidity.liquid_assets.balances_other_fi },
        { item: 'GoG Securities', amount: liquidity.liquid_assets.gog_securities },
        { item: 'Interbank Placements (≤30 days)', amount: liquidity.liquid_assets.interbank_placements_30d },
        { item: 'Placements with Other FI (≤30 days)', amount: liquidity.liquid_assets.placements_other_fi_30d },
        { item: 'Inter-Affiliate Placements', amount: liquidity.liquid_assets.inter_affiliate_placements },
        { item: 'Other Liquid Assets', amount: liquidity.liquid_assets.other_liquid_assets },
        { item: 'TOTAL LIQUID ASSETS', amount: liquidity.total_liquid_assets },
      ],
      columns: [
        { key: 'item', header: 'Item', width: 200 },
        { key: 'amount', header: 'Amount (GHS)', width: 120, format: 'currency' as const },
      ],
    },
    {
      name: 'Current Liabilities',
      data: [
        { item: 'Deposits from the Public', amount: liquidity.current_liabilities.deposits_from_public },
        { item: 'Interbank Borrowings', amount: liquidity.current_liabilities.interbank_borrowings },
        { item: 'Inter-Affiliate Borrowings', amount: liquidity.current_liabilities.inter_affiliate_borrowings },
        { item: 'Other Short-term Borrowings', amount: liquidity.current_liabilities.other_short_term_borrowings },
        { item: 'Net Contingent Liabilities', amount: liquidity.current_liabilities.net_contingent_liabilities },
        { item: 'Other Current Liabilities', amount: liquidity.current_liabilities.other_current_liabilities },
        { item: 'TOTAL CURRENT LIABILITIES', amount: liquidity.total_current_liabilities },
      ],
      columns: [
        { key: 'item', header: 'Item', width: 200 },
        { key: 'amount', header: 'Amount (GHS)', width: 120, format: 'currency' as const },
      ],
    },
    {
      name: 'Liquidity Summary',
      data: [
        { metric: 'Total Liquid Assets', value: liquidity.total_liquid_assets },
        { metric: 'Total Current Liabilities', value: liquidity.total_current_liabilities },
        { metric: 'Liquidity Ratio (%)', value: liquidity.liquidity_ratio.toFixed(2) },
        { metric: 'Minimum Requirement (%)', value: liquidity.minimum_requirement },
        { metric: 'Compliance Status', value: liquidity.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT' },
      ],
      columns: [
        { key: 'metric', header: 'Metric', width: 180 },
        { key: 'value', header: 'Value', width: 120 },
      ],
    },
  ];

  exportToExcel(sheets as any, `Liquidity-Report-${formatDate(new Date(), 'yyyy-MM-dd')}`);
}
