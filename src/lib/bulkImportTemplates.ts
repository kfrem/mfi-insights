// Bulk import templates for CSV/Excel downloads

export interface TemplateColumn {
  header: string;
  description: string;
  required: boolean;
  example: string;
  validValues?: string[];
}

export interface ImportTemplate {
  name: string;
  filename: string;
  description: string;
  columns: TemplateColumn[];
}

// Individual Client Template
export const individualClientTemplate: ImportTemplate = {
  name: 'Individual Clients',
  filename: 'individual_clients_template',
  description: 'Template for importing individual client records with full KYC details',
  columns: [
    { header: 'first_name', description: 'First name as on Ghana Card', required: true, example: 'Kwame' },
    { header: 'last_name', description: 'Last name as on Ghana Card', required: true, example: 'Asante' },
    { header: 'ghana_card_number', description: 'Ghana Card format: GHA-XXXXXXXXX-X', required: true, example: 'GHA-123456789-0' },
    { header: 'ghana_card_expiry', description: 'Expiry date (YYYY-MM-DD)', required: true, example: '2030-12-31' },
    { header: 'date_of_birth', description: 'Date of birth (YYYY-MM-DD)', required: true, example: '1985-06-15' },
    { header: 'gender', description: 'Gender code', required: true, example: 'M', validValues: ['M', 'F'] },
    { header: 'nationality', description: 'Country of citizenship', required: true, example: 'Ghanaian' },
    { header: 'occupation', description: 'Current occupation', required: true, example: 'Trader' },
    { header: 'risk_category', description: 'AML risk classification', required: true, example: 'LOW', validValues: ['LOW', 'MEDIUM', 'HIGH'] },
    { header: 'source_of_funds', description: 'Primary source of income', required: true, example: 'Trading profits from market stall' },
    { header: 'phone', description: 'Mobile phone number', required: false, example: '0201234567' },
    { header: 'email', description: 'Email address', required: false, example: 'kwame@email.com' },
    { header: 'region', description: 'Region of residence', required: true, example: 'Greater Accra' },
    { header: 'district', description: 'District of residence', required: true, example: 'Accra Metropolitan' },
    { header: 'town', description: 'Town/City of residence', required: true, example: 'Accra' },
    { header: 'landmark', description: 'Nearest landmark', required: false, example: 'Near Makola Market' },
    { header: 'gps_address', description: 'Ghana Post GPS address', required: false, example: 'GA-123-4567' },
    { header: 'proof_of_residence_type', description: 'Type of residence proof', required: false, example: 'UTILITY_BILL', validValues: ['UTILITY_BILL', 'GPS_ADDRESS', 'LEASE_AGREEMENT', 'BANK_STATEMENT'] },
    { header: 'monthly_income', description: 'Estimated monthly income (GHS)', required: false, example: '2500' },
    { header: 'monthly_expenses', description: 'Estimated monthly expenses (GHS)', required: false, example: '1500' },
  ],
};

// Group/Cooperative Template
export const groupClientTemplate: ImportTemplate = {
  name: 'Groups & Cooperatives',
  filename: 'groups_cooperatives_template',
  description: 'Template for importing group/cooperative accounts with primary contact details',
  columns: [
    { header: 'client_type', description: 'Type of group account', required: true, example: 'GROUP', validValues: ['GROUP', 'COOPERATIVE', 'SME'] },
    { header: 'group_name', description: 'Name of the group/cooperative/business', required: true, example: 'Unity Savings Group' },
    { header: 'registration_number', description: 'Official registration number (if applicable)', required: false, example: 'CS-12345' },
    { header: 'registration_date', description: 'Registration date (YYYY-MM-DD)', required: false, example: '2020-01-15' },
    { header: 'first_name', description: 'Primary contact first name', required: true, example: 'Ama' },
    { header: 'last_name', description: 'Primary contact last name', required: true, example: 'Mensah' },
    { header: 'ghana_card_number', description: 'Primary contact Ghana Card', required: true, example: 'GHA-987654321-0' },
    { header: 'ghana_card_expiry', description: 'Expiry date (YYYY-MM-DD)', required: true, example: '2029-06-30' },
    { header: 'date_of_birth', description: 'Primary contact DOB (YYYY-MM-DD)', required: true, example: '1980-03-20' },
    { header: 'gender', description: 'Primary contact gender', required: true, example: 'F', validValues: ['M', 'F'] },
    { header: 'nationality', description: 'Country of citizenship', required: true, example: 'Ghanaian' },
    { header: 'occupation', description: 'Primary contact occupation', required: true, example: 'Group Coordinator' },
    { header: 'risk_category', description: 'Group risk classification', required: true, example: 'LOW', validValues: ['LOW', 'MEDIUM', 'HIGH'] },
    { header: 'source_of_funds', description: 'Group source of funds', required: true, example: 'Member contributions and trading' },
    { header: 'phone', description: 'Primary contact phone', required: false, example: '0241234567' },
    { header: 'email', description: 'Group email', required: false, example: 'unitygroup@email.com' },
    { header: 'region', description: 'Region', required: true, example: 'Ashanti' },
    { header: 'district', description: 'District', required: true, example: 'Kumasi Metropolitan' },
    { header: 'town', description: 'Town/City', required: true, example: 'Kumasi' },
  ],
};

// Group Members Template
export const groupMembersTemplate: ImportTemplate = {
  name: 'Group Members',
  filename: 'group_members_template',
  description: 'Template for importing members of existing groups/cooperatives',
  columns: [
    { header: 'group_ghana_card', description: 'Ghana Card of the group primary contact (to link member)', required: true, example: 'GHA-987654321-0' },
    { header: 'role', description: 'Role within the group', required: true, example: 'MEMBER', validValues: ['LEADER', 'SECRETARY', 'MEMBER'] },
    { header: 'first_name', description: 'Member first name', required: true, example: 'Kofi' },
    { header: 'last_name', description: 'Member last name', required: true, example: 'Boateng' },
    { header: 'ghana_card_number', description: 'Member Ghana Card', required: true, example: 'GHA-111222333-4' },
    { header: 'ghana_card_expiry', description: 'Expiry date (YYYY-MM-DD)', required: true, example: '2028-09-15' },
    { header: 'date_of_birth', description: 'Member DOB (YYYY-MM-DD)', required: true, example: '1990-07-22' },
    { header: 'gender', description: 'Gender', required: true, example: 'M', validValues: ['M', 'F'] },
    { header: 'nationality', description: 'Country of citizenship', required: true, example: 'Ghanaian' },
    { header: 'phone', description: 'Phone number', required: false, example: '0551234567' },
    { header: 'occupation', description: 'Occupation', required: true, example: 'Farmer' },
    { header: 'risk_category', description: 'Risk classification', required: true, example: 'LOW', validValues: ['LOW', 'MEDIUM', 'HIGH'] },
    { header: 'source_of_funds', description: 'Source of funds', required: true, example: 'Farming income' },
  ],
};

// Loans Template
export const loansTemplate: ImportTemplate = {
  name: 'Loan Applications',
  filename: 'loan_applications_template',
  description: 'Template for importing loan applications for existing clients',
  columns: [
    { header: 'client_ghana_card', description: 'Ghana Card of existing client', required: true, example: 'GHA-123456789-0' },
    { header: 'loan_type', description: 'Type of loan product', required: true, example: 'SUSU_PERSONAL' },
    { header: 'principal', description: 'Loan amount in GHS', required: true, example: '5000' },
    { header: 'interest_rate', description: 'Interest rate (%)', required: true, example: '3.5' },
    { header: 'term_months', description: 'Loan term in months', required: true, example: '12' },
    { header: 'interest_method', description: 'Interest calculation method', required: true, example: 'FLAT', validValues: ['FLAT', 'REDUCING_BALANCE'] },
    { header: 'repayment_frequency', description: 'Repayment schedule', required: true, example: 'MONTHLY', validValues: ['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY'] },
    { header: 'purpose', description: 'Purpose of loan', required: false, example: 'Business expansion' },
    { header: 'penalty_type', description: 'Late payment penalty type', required: false, example: 'PERCENT_OVERDUE', validValues: ['NONE', 'FLAT_AMOUNT', 'PERCENT_OVERDUE', 'PERCENT_INSTALLMENT', 'DAILY_RATE'] },
    { header: 'penalty_value', description: 'Penalty amount or percentage', required: false, example: '5' },
    { header: 'penalty_grace_days', description: 'Grace period before penalty', required: false, example: '3' },
  ],
};

// Repayments Template
export const repaymentsTemplate: ImportTemplate = {
  name: 'Repayments',
  filename: 'repayments_template',
  description: 'Template for importing historical repayment records',
  columns: [
    { header: 'client_ghana_card', description: 'Ghana Card of client', required: true, example: 'GHA-123456789-0' },
    { header: 'loan_id', description: 'Loan ID (if known) OR leave blank to match by Ghana Card', required: false, example: '' },
    { header: 'payment_date', description: 'Date of payment (YYYY-MM-DD)', required: true, example: '2024-01-15' },
    { header: 'amount', description: 'Payment amount in GHS', required: true, example: '500' },
    { header: 'payment_method', description: 'Method of payment', required: false, example: 'CASH', validValues: ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE'] },
    { header: 'reference', description: 'Payment reference number', required: false, example: 'PAY-2024-001' },
    { header: 'notes', description: 'Additional notes', required: false, example: 'Partial payment' },
  ],
};

// All templates
export const allTemplates: ImportTemplate[] = [
  individualClientTemplate,
  groupClientTemplate,
  groupMembersTemplate,
  loansTemplate,
  repaymentsTemplate,
];

// Generate CSV content from template
export function generateTemplateCSV(template: ImportTemplate): string {
  const headers = template.columns.map(col => col.header).join(',');
  const examples = template.columns.map(col => {
    const value = col.example;
    // Escape values with commas or quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
  
  return `${headers}\n${examples}`;
}

// Generate Excel XML content from template
export function generateTemplateExcel(template: ImportTemplate): string {
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const headerRow = template.columns.map(col => 
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`
  ).join('');

  const exampleRow = template.columns.map(col => 
    `<Cell><Data ss:Type="String">${escapeXml(col.example)}</Data></Cell>`
  ).join('');

  const descriptionRow = template.columns.map(col => 
    `<Cell ss:StyleID="Description"><Data ss:Type="String">${escapeXml(col.description)}${col.required ? ' (REQUIRED)' : ' (optional)'}${col.validValues ? ` [Valid: ${col.validValues.join(', ')}]` : ''}</Data></Cell>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"/>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Description">
      <Font ss:Italic="1" ss:Color="#666666"/>
      <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(template.name)}">
    <Table>
      <Row>${descriptionRow}</Row>
      <Row>${headerRow}</Row>
      <Row>${exampleRow}</Row>
    </Table>
  </Worksheet>
</Workbook>`;
}

// Download helper
export function downloadTemplate(template: ImportTemplate, format: 'csv' | 'excel'): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'csv') {
    content = generateTemplateCSV(template);
    filename = `${template.filename}.csv`;
    mimeType = 'text/csv;charset=utf-8;';
  } else {
    content = generateTemplateExcel(template);
    filename = `${template.filename}.xls`;
    mimeType = 'application/vnd.ms-excel';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
