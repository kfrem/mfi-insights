import { useState, useEffect } from 'react';
import { useOrganisationSettings, useUpdateOrganisationSettings, useBogTierConfigs } from '@/hooks/useBogTiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Shield, 
  Landmark, 
  FileCheck, 
  AlertTriangle,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import type { BogMfiTier } from '@/types/bogTiers';
import { BOG_TIER_LABELS } from '@/types/bogTiers';

export function OrganisationTierSettings() {
  const { data: settings, isLoading: settingsLoading } = useOrganisationSettings();
  const { data: tierConfigs, isLoading: configsLoading } = useBogTierConfigs();
  const updateSettings = useUpdateOrganisationSettings();

  const [formData, setFormData] = useState({
    bog_tier: 'TIER_4_MFC' as BogMfiTier,
    license_number: '',
    license_expiry: '',
    max_loan_amount: '',
    max_single_obligor_limit: '',
    net_worth: '',
    car_threshold: '10',
    liquidity_threshold: '15',
    prudential_return_frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        bog_tier: settings.bog_tier,
        license_number: settings.license_number || '',
        license_expiry: settings.license_expiry || '',
        max_loan_amount: settings.max_loan_amount?.toString() || '',
        max_single_obligor_limit: settings.max_single_obligor_limit?.toString() || '',
        net_worth: settings.net_worth?.toString() || '',
        car_threshold: settings.car_threshold?.toString() || '10',
        liquidity_threshold: settings.liquidity_threshold?.toString() || '15',
        prudential_return_frequency: settings.prudential_return_frequency || 'MONTHLY',
      });
    }
  }, [settings]);

  const selectedTierConfig = tierConfigs?.find(t => t.tier === formData.bog_tier);

  // Calculate single obligor limit from net worth
  const calculatedSingleObligorLimit = formData.net_worth && selectedTierConfig
    ? (parseFloat(formData.net_worth) * (selectedTierConfig.single_obligor_limit_percent / 100))
    : null;

  const handleSave = () => {
    updateSettings.mutate({
      bog_tier: formData.bog_tier,
      license_number: formData.license_number || null,
      license_expiry: formData.license_expiry || null,
      max_loan_amount: formData.max_loan_amount ? parseFloat(formData.max_loan_amount) : null,
      max_single_obligor_limit: formData.max_single_obligor_limit ? parseFloat(formData.max_single_obligor_limit) : null,
      net_worth: formData.net_worth ? parseFloat(formData.net_worth) : null,
      car_threshold: parseFloat(formData.car_threshold) || 10,
      liquidity_threshold: parseFloat(formData.liquidity_threshold) || 15,
      prudential_return_frequency: formData.prudential_return_frequency,
    });
  };

  if (settingsLoading || configsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Current Tier Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank of Ghana MFI Tier Classification
          </CardTitle>
          <CardDescription>
            Configure your institution's regulatory tier and associated limits per BoG guidelines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier Selection */}
          <div className="space-y-3">
            <Label>Institution Tier *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {tierConfigs?.map((tier) => {
                const label = BOG_TIER_LABELS[tier.tier];
                const isSelected = formData.bog_tier === tier.tier;
                
                return (
                  <button
                    key={tier.tier}
                    type="button"
                    onClick={() => setFormData({ ...formData, bog_tier: tier.tier })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${label.color}`} />
                      <Badge variant={isSelected ? 'default' : 'outline'}>
                        {label.shortName}
                      </Badge>
                    </div>
                    <div className="font-medium text-sm">{tier.tier_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Min Capital: {formatCurrency(tier.min_capital_ghs)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Tier Details */}
          {selectedTierConfig && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{selectedTierConfig.tier_name}</p>
                  <p className="text-sm">{selectedTierConfig.tier_description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span>CAR Requirement: <strong>{selectedTierConfig.car_requirement}%</strong></span>
                    <span>Liquidity: <strong>{selectedTierConfig.liquidity_requirement}%</strong></span>
                    <span>Single Obligor: <strong>{selectedTierConfig.single_obligor_limit_percent}%</strong> of net worth</span>
                    {selectedTierConfig.max_loan_per_borrower_ghs && (
                      <span>Max Loan: <strong>{formatCurrency(selectedTierConfig.max_loan_per_borrower_ghs)}</strong></span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* License Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">
                <FileCheck className="h-4 w-4 inline mr-1" />
                BoG License Number
              </Label>
              <Input
                id="license_number"
                placeholder="MFC/2024/001"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry Date</Label>
              <Input
                id="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier-Specific Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Lending Limits & Thresholds
          </CardTitle>
          <CardDescription>
            Override default tier limits or set custom thresholds for your institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Net Worth for Single Obligor Calculation */}
          <div className="space-y-2">
            <Label htmlFor="net_worth" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Institution Net Worth / Capital (GHS) *
            </Label>
            <Input
              id="net_worth"
              type="number"
              placeholder="Enter institution's net worth"
              value={formData.net_worth}
              onChange={(e) => setFormData({ ...formData, net_worth: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Required for calculating single obligor limit ({selectedTierConfig?.single_obligor_limit_percent}% of net worth)
            </p>
            {calculatedSingleObligorLimit && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Calculated Single Obligor Limit: <strong>{formatCurrency(calculatedSingleObligorLimit)}</strong> 
                  ({selectedTierConfig?.single_obligor_limit_percent}% of {formatCurrency(parseFloat(formData.net_worth))})
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_loan_amount">Maximum Loan Amount (GHS)</Label>
              <Input
                id="max_loan_amount"
                type="number"
                placeholder={selectedTierConfig?.max_loan_per_borrower_ghs?.toString() || 'No limit'}
                value={formData.max_loan_amount}
                onChange={(e) => setFormData({ ...formData, max_loan_amount: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use tier default
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_single_obligor">Single Obligor Limit Override (GHS)</Label>
              <Input
                id="max_single_obligor"
                type="number"
                placeholder={calculatedSingleObligorLimit ? formatCurrency(calculatedSingleObligorLimit) : 'Set net worth first'}
                value={formData.max_single_obligor_limit}
                onChange={(e) => setFormData({ ...formData, max_single_obligor_limit: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Override calculated limit (leave empty to use {selectedTierConfig?.single_obligor_limit_percent}% of net worth)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_threshold">CAR Threshold (%)</Label>
              <Input
                id="car_threshold"
                type="number"
                step="0.1"
                value={formData.car_threshold}
                onChange={(e) => setFormData({ ...formData, car_threshold: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Capital Adequacy Ratio minimum
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="liquidity_threshold">Liquidity Threshold (%)</Label>
              <Input
                id="liquidity_threshold"
                type="number"
                step="0.1"
                value={formData.liquidity_threshold}
                onChange={(e) => setFormData({ ...formData, liquidity_threshold: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum liquidity ratio
              </p>
            </div>
            <div className="space-y-2">
              <Label>Prudential Returns Frequency</Label>
              <Select 
                value={formData.prudential_return_frequency}
                onValueChange={(v) => setFormData({ ...formData, prudential_return_frequency: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="w-full md:w-auto"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}