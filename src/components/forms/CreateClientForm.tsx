import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateClient } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRegionOptions, getDistrictOptions, getTownOptions } from '@/data/ghanaLocations';
import { getBusinessTypeOptions } from '@/data/ghanaLoanTypes';

// Ghana Card format: GHA-XXXXXXXXX-X (13 digits)
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

const clientSchema = z.object({
  // Mandatory KYC fields per BoG AML/CFT&P 2022
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  ghana_card_number: z
    .string()
    .min(1, 'Ghana Card number is required')
    .regex(ghanaCardRegex, 'Invalid Ghana Card format (GHA-XXXXXXXXX-X)'),
  ghana_card_expiry: z.string().min(1, 'Ghana Card expiry date is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['M', 'F'], { required_error: 'Gender is required' }),
  nationality: z.string().min(1, 'Nationality is required').max(100),
  occupation: z.string().min(1, 'Occupation is required').max(200),
  risk_category: z.enum(['LOW', 'MEDIUM', 'HIGH'], { required_error: 'Risk category is required' }),
  source_of_funds: z.string().min(1, 'Source of funds is required').max(500),
  // Location fields
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),
  town: z.string().min(1, 'Town/City is required'),
  landmark: z.string().max(200).optional(),
  gps_address: z.string().max(20).optional(),
  // Business information
  has_business: z.boolean().optional(),
  business_name: z.string().max(200).optional(),
  business_type: z.string().optional(),
  business_years: z.coerce.number().min(0).max(100).optional(),
  monthly_income: z.coerce.number().min(0).optional(),
  monthly_expenses: z.coerce.number().min(0).optional(),
  // Optional fields
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  proof_of_residence_type: z.enum(['UTILITY_BILL', 'GPS_ADDRESS', 'LEASE_AGREEMENT', 'BANK_STATEMENT']).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function CreateClientForm() {
  const { selectedOrgId } = useOrganisation();
  const createClient = useCreateClient();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      ghana_card_number: '',
      ghana_card_expiry: '',
      date_of_birth: '',
      gender: undefined,
      nationality: 'Ghanaian',
      occupation: '',
      risk_category: undefined,
      source_of_funds: '',
      region: '',
      district: '',
      town: '',
      landmark: '',
      gps_address: '',
      has_business: false,
      business_name: '',
      business_type: '',
      business_years: 0,
      monthly_income: 0,
      monthly_expenses: 0,
      phone: '',
      email: '',
      address: '',
      proof_of_residence_type: undefined,
    },
  });

  const watchHasBusiness = form.watch('has_business');
  const regionOptions = getRegionOptions();
  const districtOptions = getDistrictOptions(selectedRegion);
  const townOptions = getTownOptions(selectedRegion, selectedDistrict);
  const businessTypeOptions = getBusinessTypeOptions();

  const onSubmit = async (values: ClientFormValues) => {
    if (!selectedOrgId) return;

    await createClient.mutateAsync({
      org_id: selectedOrgId,
      first_name: values.first_name,
      last_name: values.last_name,
      ghana_card_number: values.ghana_card_number,
      ghana_card_expiry: values.ghana_card_expiry,
      date_of_birth: values.date_of_birth,
      gender: values.gender,
      nationality: values.nationality,
      occupation: values.occupation,
      risk_category: values.risk_category,
      source_of_funds: values.source_of_funds,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      proof_of_residence_type: values.proof_of_residence_type,
    });

    form.reset();
  };

  return (
    <div className="form-section">
      <h2 className="text-lg font-semibold mb-2">Create New Client</h2>
      <p className="text-sm text-muted-foreground mb-6">
        All fields marked with * are mandatory per BoG AML/CFT&P Guidelines 2022
      </p>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ghana Card is the sole acceptable identifier for individuals per Bank of Ghana regulations.
        </AlertDescription>
      </Alert>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Ghana Card Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Ghana Card Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kwame" {...field} />
                    </FormControl>
                    <FormDescription>As shown on Ghana Card</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Asante" {...field} />
                    </FormControl>
                    <FormDescription>As shown on Ghana Card</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ghana_card_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghana Card Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="GHA-123456789-0" {...field} />
                    </FormControl>
                    <FormDescription>13-digit unique identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ghana_card_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghana Card Expiry *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ghanaian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Section: KYC/AML Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              KYC / AML Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation *</FormLabel>
                    <FormControl>
                      <Input placeholder="Trader, Hairdresser, Farmer, etc." {...field} />
                    </FormControl>
                    <FormDescription>Used for risk classification</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="risk_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low Risk - Salaried, Pensioners</SelectItem>
                        <SelectItem value="MEDIUM">Medium Risk - Self-employed, Traders</SelectItem>
                        <SelectItem value="HIGH">High Risk - PEPs, Cross-border, Forex</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Per BoG AML/CFT&P guidelines</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="source_of_funds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source of Funds *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the primary source of income/funds (e.g., Salary from ABC Company, Trading profits from market stall, Farming income)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Required for AML compliance</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Location */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Location Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedRegion(value);
                        setSelectedDistrict('');
                        form.setValue('district', '');
                        form.setValue('town', '');
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDistrict(value);
                        form.setValue('town', '');
                      }} 
                      value={field.value}
                      disabled={!selectedRegion}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedRegion ? "Select district" : "Select region first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districtOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="town"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Town/City *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedDistrict}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDistrict ? "Select town" : "Select district first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {townOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="landmark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landmark / Street</FormLabel>
                    <FormControl>
                      <Input placeholder="Near Kantamanto Market, Osu Oxford Street" {...field} />
                    </FormControl>
                    <FormDescription>Nearby landmark for easy identification</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gps_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghana GPS Address</FormLabel>
                    <FormControl>
                      <Input placeholder="GA-123-4567" {...field} />
                    </FormControl>
                    <FormDescription>Digital address (GhanaPostGPS)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proof_of_residence_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof of Residence Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UTILITY_BILL">Utility Bill (ECG, Ghana Water)</SelectItem>
                      <SelectItem value="GPS_ADDRESS">GPS Digital Address Confirmation</SelectItem>
                      <SelectItem value="LEASE_AGREEMENT">Rent/Lease Agreement</SelectItem>
                      <SelectItem value="BANK_STATEMENT">Bank Statement with Address</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Document used to verify residence</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Contact */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="0201234567" {...field} />
                    </FormControl>
                    <FormDescription>Mobile money number preferred</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="kwame@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Section: Business Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Business / Employment Information
            </h3>
            
            <FormField
              control={form.control}
              name="has_business"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Client has a business
                    </FormLabel>
                    <FormDescription>
                      Check if client operates a business (trading, farming, services, etc.)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchHasBusiness && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Kofi's Trading Enterprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="business_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years in Business</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income (GHS)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="100" placeholder="5000" {...field} />
                        </FormControl>
                        <FormDescription>Average monthly revenue</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_expenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Expenses (GHS)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="100" placeholder="3000" {...field} />
                        </FormControl>
                        <FormDescription>Average monthly costs</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={createClient.isPending || !selectedOrgId}>
            {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client
          </Button>
        </form>
      </Form>
    </div>
  );
}
