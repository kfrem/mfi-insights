export interface Organisation {
  org_id: string;
  name: string;
  trading_name?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  registration_number?: string | null;
  tax_id?: string | null;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrganisationFormData {
  name: string;
  trading_name?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  registration_number?: string;
  tax_id?: string;
}
