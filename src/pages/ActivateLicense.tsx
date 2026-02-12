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

    const normalizedCode = licenseCode.trim().toUpperCase();

    try {
      // Validate license code against the database
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select('license_id, code, plan, status, max_users, expires_at')
        .eq('code', normalizedCode)
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        // Check if the license has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('This license code has expired. Please contact your administrator for a new code.');
          setIsValidating(false);
          return;
        }

        setIsValid(true);
        // Store the license details for the onboarding flow
        sessionStorage.setItem('mfi_license_code', normalizedCode);
        sessionStorage.setItem('mfi_license_plan', data.plan ?? '');
        sessionStorage.setItem('mfi_license_id', data.license_id);

        // Wait a moment to show success, then redirect to registration
        setTimeout(() => {
          navigate('/register');
        }, 1500);
      } else {
        setError('Invalid license code. Please check your code and try again.');
        setIsValidating(false);
      }
    } catch {
      // Fallback: if the licenses table doesn't exist yet, use local validation
      const VALID_LICENSE_CODES = ['MFI-2024-TRIAL', 'MFI-2024-STARTER', 'MFI-2024-PRO', 'MFI-2024-ENTERPRISE'];
      if (VALID_LICENSE_CODES.includes(normalizedCode)) {
        setIsValid(true);
        sessionStorage.setItem('mfi_license_code', normalizedCode);
        setTimeout(() => {
          navigate('/register');
        }, 1500);
      } else {
        setError('Invalid license code. Please check your code and try again.');
        setIsValidating(false);
      }
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
