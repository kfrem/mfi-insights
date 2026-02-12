import { useState, useEffect } from 'react';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, Save } from 'lucide-react';
import { logger } from '@/lib/logger';
import { GHANA_REGIONS } from '@/data/ghanaLocations';

export function OrganisationDetailsSettings() {
  const { selectedOrg, refetch } = useOrganisation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (selectedOrg) {
      setFormData({
        name: selectedOrg.name || '',
        trading_name: selectedOrg.trading_name || '',
        address: selectedOrg.address || '',
        city: selectedOrg.city || '',
        region: selectedOrg.region || '',
        postal_code: selectedOrg.postal_code || '',
        country: selectedOrg.country || 'Ghana',
        phone: selectedOrg.phone || '',
        email: selectedOrg.email || '',
        website: selectedOrg.website || '',
        registration_number: selectedOrg.registration_number || '',
        tax_id: selectedOrg.tax_id || '',
      });
    }
  }, [selectedOrg]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('organisations')
        .update({
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
        })
        .eq('org_id', selectedOrg.org_id);

      if (error) throw error;

      await refetch();

      toast({
        title: 'Organisation Updated',
        description: 'Your organisation details have been saved successfully.',
      });
    } catch (err: any) {
      logger.error('Failed to update organisation', 'OrganisationDetailsSettings', { error: err?.message || String(err) });
      toast({
        title: 'Error',
        description: err.message || 'Failed to update organisation details.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedOrg) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No organisation selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organisation Details
        </CardTitle>
        <CardDescription>
          Update your organisation's information. This will appear on all reports and documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organisation Identity */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">Organisation Identity</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Legal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trading_name">Trading Name</Label>
                <Input
                  id="trading_name"
                  value={formData.trading_name}
                  onChange={(e) => handleChange('trading_name', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => handleChange('registration_number', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID (TIN)</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={isSubmitting || selectedOrg.is_demo}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City/Town</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={formData.region} 
                  onValueChange={(value) => handleChange('region', value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
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
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isSubmitting || selectedOrg.is_demo}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                disabled={isSubmitting || selectedOrg.is_demo}
              />
            </div>
          </div>

          {selectedOrg.is_demo ? (
            <p className="text-sm text-muted-foreground text-center">
              Demo organisation details cannot be edited. Create your own organisation to customize these settings.
            </p>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
