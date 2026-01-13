import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, CheckCircle } from 'lucide-react';
import { GHANA_REGIONS } from '@/data/ghanaLocations';

export default function OrganisationOnboarding() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    trading_name: '',
    address: '',
    city: '',
    region: '',
    postal_code: '',
    country: 'Ghana',
    phone: '',
    email: '',
    website: '',
    registration_number: '',
    tax_id: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create an organisation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the organisation
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name: formData.name,
          trading_name: formData.trading_name || null,
          address: formData.address || null,
          city: formData.city || null,
          region: formData.region || null,
          postal_code: formData.postal_code || null,
          country: formData.country,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          registration_number: formData.registration_number || null,
          tax_id: formData.tax_id || null,
          is_demo: false,
        })
        .select('org_id')
        .single();

      if (orgError) throw orgError;

      const orgId = orgData.org_id;

      // 2. Add user to the organisation
      const { error: membershipError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          org_id: orgId,
        });

      if (membershipError) throw membershipError;

      // 3. Assign ADMIN role to the creating user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          org_id: orgId,
          role: 'ADMIN',
        });

      if (roleError) throw roleError;

      // 4. Create default organisation settings
      const { error: settingsError } = await supabase
        .from('organisation_settings')
        .insert({
          org_id: orgId,
          bog_tier: 'TIER_4_MFC',
        });

      if (settingsError) throw settingsError;

      setStep('success');
    } catch (err: any) {
      console.error('Failed to create organisation:', err);
      setError(err.message || 'Failed to create organisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Organisation Created!</CardTitle>
            <CardDescription>
              Your organisation <strong>{formData.name}</strong> has been successfully created. 
              You have been assigned as the Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => {
                // Force reload to refresh context
                window.location.href = '/';
              }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Your Organisation</CardTitle>
            <CardDescription>
              Set up your microfinance institution details. This information will appear on all reports and documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Organisation Identity */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Organisation Identity</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Legal Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., ABC Microfinance Limited"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trading_name">Trading Name</Label>
                    <Input
                      id="trading_name"
                      placeholder="e.g., ABC MFI"
                      value={formData.trading_name}
                      onChange={(e) => handleChange('trading_name', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      placeholder="e.g., CS123456789"
                      value={formData.registration_number}
                      onChange={(e) => handleChange('registration_number', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID (TIN)</Label>
                    <Input
                      id="tax_id"
                      placeholder="e.g., C0012345678"
                      value={formData.tax_id}
                      onChange={(e) => handleChange('tax_id', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Finance Street"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City/Town</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Accra"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select 
                      value={formData.region} 
                      onValueChange={(value) => handleChange('region', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {GHANA_REGIONS.map((region) => (
                          <SelectItem key={region.code} value={region.name}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      placeholder="e.g., GA-123"
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="e.g., +233 20 123 4567"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., info@abcmfi.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="e.g., https://www.abcmfi.com"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/login')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organisation'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
