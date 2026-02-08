import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, BarChart3, Users, FileText, TrendingUp } from 'lucide-react';

const loadingSteps = [
  { icon: Building2, text: 'Loading demo organisation...' },
  { icon: Users, text: 'Preparing sample client data...' },
  { icon: FileText, text: 'Setting up loan portfolios...' },
  { icon: BarChart3, text: 'Generating dashboard metrics...' },
  { icon: TrendingUp, text: 'Finalizing reports...' }
];

export default function DemoAccess() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Demo mode is only available in development builds
    if (!import.meta.env.DEV) {
      navigate('/welcome');
      return;
    }

    // Mark session as demo mode
    sessionStorage.setItem('mfi_demo_mode', 'true');

    // Animate through loading steps
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          // Redirect to dashboard after animation
          setTimeout(() => {
            navigate('/');
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [navigate]);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent/90 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <CurrentIcon className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl">Entering Demo Mode</CardTitle>
          <CardDescription>
            Experience the full power of MFI Pro with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-3">
            {loadingSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-primary/10' : isComplete ? 'opacity-60' : 'opacity-30'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary text-white' : isComplete ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.text}
                  </span>
                  {isActive && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
            <h4 className="font-medium text-accent text-sm mb-1">Demo Environment</h4>
            <p className="text-xs text-muted-foreground">
              All data is simulated. Changes will not persist between sessions. 
              Ready to start fresh? Activate your license for a clean system.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
