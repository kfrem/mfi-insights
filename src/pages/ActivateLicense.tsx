import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Key, ArrowLeft, Loader2, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ActivateLicense() {
  const [licenseCode, setLicenseCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    try {
      const normalizedCode = licenseCode.trim().toUpperCase();

      const { data, error: rpcError } = await supabase.rpc('validate_license_key', {
        license_code: normalizedCode,
      });

      if (rpcError) {
        setError('Unable to validate license. Please try again later.');
        setIsValidating(false);
        return;
      }

      const result = data as { valid: boolean; error?: string; tier?: string; max_users?: number; valid_days?: number };

      if (result.valid) {
        setIsValid(true);
        // Store license info for the onboarding/registration flow
        sessionStorage.setItem('mfi_license_code', normalizedCode);
        sessionStorage.setItem('mfi_license_tier', result.tier ?? '');
        sessionStorage.setItem('mfi_license_max_users', String(result.max_users ?? 0));
        sessionStorage.setItem('mfi_license_valid_days', String(result.valid_days ?? 0));

        setTimeout(() => {
          navigate('/register');
        }, 1500);
      } else {
        setError(result.error ?? 'Invalid license code.');
        setIsValidating(false);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsValidating(false);
    }
  };

  if (isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">License Validated!</CardTitle>
            <CardDescription>
              Your license code has been verified. Redirecting you to create your account...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4 gap-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Key className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Activate Your License</CardTitle>
          <CardDescription>
            Enter the license code provided by your administrator to set up your MFI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="license">License Code</Label>
              <Input
                id="license"
                type="text"
                placeholder="MFI-2024-XXXXX"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                required
                disabled={isValidating}
                className="font-mono text-center text-lg tracking-wider"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: MFI-YEAR-PLAN (e.g., MFI-2024-PRO)
              </p>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isValidating || !licenseCode.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Validate License
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-foreground mb-2">Don't have a license code?</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Contact your MFI Pro representative to obtain a license code, or try our demo first.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/demo')}
            >
              Try Demo Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
