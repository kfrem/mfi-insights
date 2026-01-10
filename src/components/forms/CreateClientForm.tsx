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
import { Loader2, AlertCircle, User, Users, Building2, Briefcase } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRegionOptions, getDistrictOptions, getTownOptions } from '@/data/ghanaLocations';
import { getBusinessTypeOptions } from '@/data/ghanaLoanTypes';
import { GroupMemberForm, MemberData, emptyMember } from './GroupMemberForm';
import { ClientType } from '@/types/mfi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Ghana Card format: GHA-XXXXXXXXX-X (13 digits)
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

const clientSchema = z.object({
  // Client type selection
  client_type: z.enum(['INDIVIDUAL', 'GROUP', 'COOPERATIVE', 'SME'], { required_error: 'Client type is required' }),
  // Group/Cooperative/SME specific fields
  group_name: z.string().optional(),
  registration_number: z.string().optional(),
  registration_date: z.string().optional(),
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
}).refine((data) => {
  // Group name required for non-individual types
  if (data.client_type !== 'INDIVIDUAL' && !data.group_name) {
    return false;
  }
  return true;
}, {
  message: 'Group/Business name is required',
  path: ['group_name'],
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function CreateClientForm() {
  const { selectedOrgId } = useOrganisation();
  const createClient = useCreateClient();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_type: 'INDIVIDUAL',
      group_name: '',
      registration_number: '',
      registration_date: '',
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

  const watchClientType = form.watch('client_type');
  const watchHasBusiness = form.watch('has_business');
  const isGroupType = watchClientType !== 'INDIVIDUAL';

  const regionOptions = getRegionOptions();
  const districtOptions = getDistrictOptions(selectedRegion);
  const townOptions = getTownOptions(selectedRegion, selectedDistrict);
  const businessTypeOptions = getBusinessTypeOptions();

  const handleAddMember = () => {
    setMembers([...members, { ...emptyMember }]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleUpdateMember = (index: number, field: keyof MemberData, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const validateMembers = (): boolean => {
    if (!isGroupType) return true;

    const hasLeader = members.some(m => m.role === 'LEADER');
    const hasSecretary = members.some(m => m.role === 'SECRETARY');

    if (!hasLeader || !hasSecretary) {
      toast.error('Group must have at least a Leader and Secretary');
      return false;
    }

    // Validate each member has required fields
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.first_name || !m.last_name || !m.ghana_card_number || !m.ghana_card_expiry || 
          !m.date_of_birth || !m.occupation || !m.source_of_funds) {
        toast.error(`Member ${i + 1} is missing required fields`);
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (values: ClientFormValues) => {
    if (!selectedOrgId) return;
    if (!validateMembers()) return;

    setIsSubmitting(true);

    try {
      // Create client in Lovable Cloud
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          org_id: selectedOrgId,
          client_type: values.client_type,
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
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          proof_of_residence_type: values.proof_of_residence_type || null,
          group_name: values.group_name || null,
          registration_number: values.registration_number || null,
          registration_date: values.registration_date || null,
          monthly_income: values.monthly_income || null,
          monthly_expenses: values.monthly_expenses || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // If group type, add members
      if (isGroupType && members.length > 0 && clientData) {
        const memberInserts = members.map(m => ({
          org_id: selectedOrgId,
          client_id: clientData.client_id,
          role: m.role,
          first_name: m.first_name,
          last_name: m.last_name,
          ghana_card_number: m.ghana_card_number,
          ghana_card_expiry: m.ghana_card_expiry,
          date_of_birth: m.date_of_birth,
          gender: m.gender,
          nationality: m.nationality,
          phone: m.phone || null,
          email: m.email || null,
          occupation: m.occupation,
          risk_category: m.risk_category,
          source_of_funds: m.source_of_funds,
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      toast.success(`${values.client_type === 'INDIVIDUAL' ? 'Client' : values.client_type} created successfully`);
      form.reset();
      setMembers([]);
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientTypeDescription = (type: ClientType) => {
    switch (type) {
      case 'INDIVIDUAL':
        return 'Single person account';
      case 'GROUP':
        return 'Informal group with joint liability';
      case 'COOPERATIVE':
        return 'Registered cooperative society';
      case 'SME':
        return 'Small/Medium Enterprise';
    }
  };

  const getClientTypeIcon = (type: ClientType) => {
    switch (type) {
      case 'INDIVIDUAL':
        return <User className="h-4 w-4" />;
      case 'GROUP':
        return <Users className="h-4 w-4" />;
      case 'COOPERATIVE':
        return <Building2 className="h-4 w-4" />;
      case 'SME':
        return <Briefcase className="h-4 w-4" />;
    }
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
          {/* Section: Client Type Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Account Type
            </h3>
            
            <FormField
              control={form.control}
              name="client_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Type *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['INDIVIDUAL', 'GROUP', 'COOPERATIVE', 'SME'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          field.onChange(type);
                          if (type === 'INDIVIDUAL') {
                            setMembers([]);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          field.value === type
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getClientTypeIcon(type)}
                          <span className="font-medium">{type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getClientTypeDescription(type)}
                        </p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Group/Cooperative/SME Specific Fields */}
            {isGroupType && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="group_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchClientType === 'SME' ? 'Business Name' : 
                           watchClientType === 'COOPERATIVE' ? 'Cooperative Name' : 'Group Name'} *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              watchClientType === 'SME' ? 'ABC Trading Ltd' : 
                              watchClientType === 'COOPERATIVE' ? 'Farmers Cooperative' : 
                              'Unity Savings Group'
                            } 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {(watchClientType === 'COOPERATIVE' || watchClientType === 'SME') && (
                    <>
                      <FormField
                        control={form.control}
                        name="registration_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number</FormLabel>
                            <FormControl>
                              <Input placeholder="CS-12345" {...field} />
                            </FormControl>
                            <FormDescription>
                              {watchClientType === 'COOPERATIVE' ? 'Cooperative registration' : 'Business registration'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="registration_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Primary Contact / Representative */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {isGroupType ? 'Primary Contact / Representative' : 'Ghana Card Details'}
            </h3>
            {isGroupType && (
              <p className="text-xs text-muted-foreground">
                This person is the main contact for the {watchClientType.toLowerCase()}. 
                Add group members separately below.
              </p>
            )}
            
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

          {/* Section: Business Information (for Individual) */}
          {!isGroupType && (
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
          )}

          {/* Section: Group Members */}
          {isGroupType && (
            <div className="pt-4 border-t">
              <GroupMemberForm
                members={members}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onUpdateMember={handleUpdateMember}
                clientType={watchClientType as 'GROUP' | 'COOPERATIVE' | 'SME'}
              />
            </div>
          )}

          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !selectedOrgId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {watchClientType === 'INDIVIDUAL' ? 'Client' : watchClientType}
          </Button>
        </form>
      </Form>
    </div>
  );
}