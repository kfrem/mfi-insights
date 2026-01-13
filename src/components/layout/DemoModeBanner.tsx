import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, X } from 'lucide-react';

export function DemoModeBanner() {
  const navigate = useNavigate();
  const isDemoMode = sessionStorage.getItem('mfi_demo_mode') === 'true';

  if (!isDemoMode) return null;

  const handleExitDemo = () => {
    sessionStorage.removeItem('mfi_demo_mode');
    navigate('/welcome');
  };

  const handleActivateLicense = () => {
    sessionStorage.removeItem('mfi_demo_mode');
    navigate('/activate');
  };

  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-accent" />
          <span className="text-accent font-medium">Demo Mode</span>
          <span className="text-muted-foreground hidden sm:inline">
            — Data shown is simulated. Ready to start fresh?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivateLicense}
            className="gap-1.5 h-7 text-xs border-accent/30 text-accent hover:bg-accent/10"
          >
            <Key className="h-3 w-3" />
            <span className="hidden sm:inline">Activate License</span>
            <span className="sm:hidden">Activate</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitDemo}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Exit Demo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
