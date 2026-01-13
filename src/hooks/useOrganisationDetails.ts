import { useOrganisation } from '@/contexts/OrganisationContext';

export function useOrganisationDetails() {
  const { selectedOrg } = useOrganisation();

  const getReportHeader = () => {
    if (!selectedOrg) return null;

    return {
      name: selectedOrg.name,
      tradingName: selectedOrg.trading_name,
      fullAddress: [
        selectedOrg.address,
        selectedOrg.city,
        selectedOrg.region,
        selectedOrg.postal_code,
        selectedOrg.country,
      ].filter(Boolean).join(', '),
      phone: selectedOrg.phone,
      email: selectedOrg.email,
      website: selectedOrg.website,
      registrationNumber: selectedOrg.registration_number,
      taxId: selectedOrg.tax_id,
      logoUrl: selectedOrg.logo_url,
    };
  };

  return {
    organisation: selectedOrg,
    getReportHeader,
    isDemo: selectedOrg?.is_demo ?? false,
  };
}
