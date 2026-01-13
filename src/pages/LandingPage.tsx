import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Users,
  FileText,
  Building2,
  ArrowRight,
  Play,
  Key,
  CheckCircle,
  LineChart,
  Wallet,
  AlertTriangle,
  Clock,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Executive Dashboards',
    description: 'Real-time KPIs, portfolio health, and performance metrics at a glance'
  },
  {
    icon: PieChart,
    title: 'Portfolio Analysis',
    description: 'PAR aging, BOG bucket classification, and risk stratification'
  },
  {
    icon: TrendingUp,
    title: 'Financial Reports',
    description: 'Profitability metrics, deposit monitoring, and governance risk panels'
  },
  {
    icon: Shield,
    title: 'Regulatory Compliance',
    description: 'CAR calculator, liquidity ratios, and prudential returns tracking'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Individual, group, and SME client onboarding with KYC compliance'
  },
  {
    icon: FileText,
    title: 'Loan Workflows',
    description: 'Application to disbursement pipeline with approval hierarchies'
  },
  {
    icon: Wallet,
    title: 'Investor Portal',
    description: 'Real-time investment tracking, dividend history, and portfolio allocation for shareholders'
  }
];

const metrics = [
  { label: 'Active Loans', value: '₵2.4M', icon: Wallet, color: 'bg-primary' },
  { label: 'PAR > 30 Days', value: '3.2%', icon: AlertTriangle, color: 'bg-accent' },
  { label: 'Active Clients', value: '1,247', icon: Users, color: 'bg-chart-3' },
  { label: 'Collection Rate', value: '94.8%', icon: TrendingUp, color: 'bg-status-current' }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MFI Pro</span>
          </div>
          <Button 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate('/login')}
          >
            Staff Login
          </Button>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white/90 text-sm mb-6">
              <Globe className="h-4 w-4" />
              Trusted by MFIs across Ghana
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Complete Microfinance
              <span className="block text-accent-foreground/90">Management Platform</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-2xl">
              BOG-compliant dashboard system with real-time portfolio monitoring, 
              regulatory reporting, and comprehensive loan lifecycle management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 gap-2 text-base"
                onClick={() => navigate('/demo')}
              >
                <Play className="h-5 w-5" />
                Try Live Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2 text-base"
                onClick={() => navigate('/activate')}
              >
                <Key className="h-5 w-5" />
                Activate License
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Metrics Cards */}
        <div className="relative z-10 container mx-auto px-4 pb-12 -mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur shadow-lg border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${metric.color} flex items-center justify-center`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </header>

      {/* Dashboard Preview Section */}
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your MFI
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From loan origination to regulatory compliance, our platform covers 
              the entire microfinance operations lifecycle.
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="bg-card rounded-2xl border shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="bg-sidebar p-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-sidebar-foreground/60">MFI Pro Dashboard</span>
              </div>
            </div>
            <div className="p-6 bg-background">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Total Portfolio</p>
                  <p className="text-2xl font-bold">₵5,234,890</p>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12.4% vs last month</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-sm text-muted-foreground">PAR &gt; 30</p>
                  <p className="text-2xl font-bold text-foreground">3.24%</p>
                  <div className="h-2 bg-muted rounded-full mt-2">
                    <div className="h-2 bg-status-current rounded-full" style={{ width: '32%' }} />
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold text-foreground">94.8%</p>
                  <div className="h-2 bg-muted rounded-full mt-2">
                    <div className="h-2 bg-accent rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
              
              {/* Mock Chart */}
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Portfolio Trend</h3>
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Disbursements</span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">Collections</span>
                  </div>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {[65, 45, 78, 52, 88, 70, 95, 60, 82, 75, 90, 85].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1">
                      <div className="bg-primary/80 rounded-t" style={{ height: `${h}%` }} />
                      <div className="bg-accent/60 rounded-b" style={{ height: `${h * 0.8}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern MFIs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Ghana's microfinance sector with BOG tier compliance baked in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary via-primary/95 to-accent/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your MFI Operations?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Start with our interactive demo or activate your license to begin 
            managing your microfinance institution today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 gap-2"
              onClick={() => navigate('/demo')}
            >
              <Play className="h-5 w-5" />
              Explore Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2"
              onClick={() => navigate('/activate')}
            >
              <Key className="h-5 w-5" />
              Enter License Code
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-sidebar">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
                <Building2 className="h-4 w-4 text-sidebar-primary" />
              </div>
              <span className="text-sidebar-foreground font-semibold">MFI Pro</span>
            </div>
            <p className="text-sidebar-foreground/60 text-sm">
              © 2024 MFI Pro. Designed for Ghana's Microfinance Sector.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
