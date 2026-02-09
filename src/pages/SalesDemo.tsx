import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  BarChart3,
  Shield,
  Wifi,
  WifiOff,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Building2,
  Languages,
} from 'lucide-react';
import { listConfigs, getConfig } from '@/lib/regulatory/registry';
import type { SupportedCountry } from '@/lib/regulatory/types';
import { useRegulatory } from '@/contexts/RegulatoryContext';
import i18n from '@/lib/i18n';

export default function SalesDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCountry, config, formatCurrency } = useRegulatory();
  const [selectedCode, setSelectedCode] = useState<SupportedCountry>('GH');
  const configs = listConfigs();

  const selectedConfig = getConfig(selectedCode);

  const handleSelectCountry = (code: SupportedCountry) => {
    setSelectedCode(code);
    // Auto-switch language for francophone configs
    if (code === 'BCEAO') {
      i18n.changeLanguage('fr');
    } else {
      i18n.changeLanguage('en');
    }
  };

  const handleExploreDemo = () => {
    setCountry(selectedCode);
    navigate('/demo-access');
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Executive Dashboards',
      titleFr: 'Tableaux de bord exécutifs',
      description: 'Real-time KPIs, portfolio health, and performance metrics',
      descriptionFr: 'KPI en temps réel, santé du portefeuille et métriques de performance',
    },
    {
      icon: Shield,
      title: 'Regulatory Compliance',
      titleFr: 'Conformité réglementaire',
      description: 'CAR, liquidity ratios, loan classification — configured per country',
      descriptionFr: 'RAC, ratios de liquidité, classification des créances — configuré par pays',
    },
    {
      icon: FileText,
      title: 'Financial Reports',
      titleFr: 'Rapports financiers',
      description: 'Balance sheet, income statement, cash flow, and prudential returns',
      descriptionFr: 'Bilan, compte de résultat, flux de trésorerie et déclarations prudentielles',
    },
    {
      icon: Users,
      title: 'Client & Loan Management',
      titleFr: 'Gestion clients et prêts',
      description: 'Full KYC/AML, loan lifecycle, repayment tracking, penalty engine',
      descriptionFr: 'KYC/LBC complet, cycle de vie des prêts, suivi des remboursements',
    },
    {
      icon: TrendingUp,
      title: 'Portfolio Analytics',
      titleFr: 'Analyse du portefeuille',
      description: 'PAR aging, provisioning, disbursement quality, governance risk',
      descriptionFr: 'Ancienneté PAR, provisionnement, qualité des décaissements',
    },
    {
      icon: WifiOff,
      title: 'Offline-First Operations',
      titleFr: 'Opérations hors ligne',
      description: 'Field collections, client registration, and sync when back online',
      descriptionFr: 'Collectes terrain, enregistrement clients, synchronisation automatique',
    },
  ];

  const isLangFr = i18n.language === 'fr';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">MFI Clarity</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newLang = i18n.language === 'en' ? 'fr' : 'en';
                i18n.changeLanguage(newLang);
              }}
              className="text-white/70 hover:text-white"
            >
              <Languages className="h-4 w-4 mr-1" />
              {i18n.language === 'en' ? 'Français' : 'English'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="border-white/20 text-white hover:bg-white/10">
              {isLangFr ? 'Se connecter' : 'Sign In'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isLangFr ? t('demo.subtitle') : t('demo.subtitle')}
          </h1>
          <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
            {isLangFr ? t('demo.tagline') : t('demo.tagline')}
          </p>
        </div>

        {/* Country Selector */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            <Globe className="inline h-5 w-5 mr-2 text-blue-400" />
            {isLangFr ? t('demo.selectCountry') : t('demo.selectCountry')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {configs.map((c) => (
              <button
                key={c.code}
                onClick={() => handleSelectCountry(c.code)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedCode === c.code
                    ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-2">{c.flag}</div>
                <div className="font-semibold text-white">{c.label}</div>
                <div className="text-sm text-white/60 mt-1">
                  {getConfig(c.code).currency.code} &middot; {getConfig(c.code).regulator.abbreviation}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Config Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                {isLangFr ? t('demo.regulatoryFramework') : t('demo.regulatoryFramework')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'Régulateur' : 'Regulator'}</span>
                <span className="font-medium">{selectedConfig.regulator.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'Devise' : 'Currency'}</span>
                <span className="font-medium">{selectedConfig.currency.code} ({selectedConfig.currency.symbol})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'CAR minimum' : 'Minimum CAR'}</span>
                <span className="font-medium">{selectedConfig.capitalAdequacy.minimumCAR}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'Liquidité minimum' : 'Minimum Liquidity'}</span>
                <span className="font-medium">{selectedConfig.liquidity.minimumRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'Pièce d\'identité' : 'Identity Document'}</span>
                <span className="font-medium">{selectedConfig.identityDocument.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isLangFr ? 'Cadre LBC' : 'AML Framework'}</span>
                <span className="font-medium">{selectedConfig.aml.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                {isLangFr ? t('demo.classificationBuckets') : t('demo.classificationBuckets')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedConfig.loanClassification.buckets.map((bucket) => (
                  <div key={bucket.name} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                    <span className="text-white/80">{bucket.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/50">
                        {bucket.daysOverdueMax === null
                          ? `${bucket.daysOverdueMin}+ ${isLangFr ? 'jours' : 'days'}`
                          : bucket.daysOverdueMin === 0 && bucket.daysOverdueMax === 0
                          ? isLangFr ? 'À jour' : 'Current'
                          : `${bucket.daysOverdueMin}-${bucket.daysOverdueMax} ${isLangFr ? 'jours' : 'days'}`}
                      </span>
                      <span className={`font-mono font-medium ${bucket.provisionRate >= 0.5 ? 'text-red-400' : bucket.provisionRate >= 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(bucket.provisionRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Institution Tiers */}
        <div className="mb-16 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-white text-center mb-4">
            {isLangFr ? t('demo.institutionTiers') : t('demo.institutionTiers')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedConfig.institutionTiers.map((tier) => (
              <div key={tier.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${tier.color} mb-2`}>
                  {tier.shortName}
                </div>
                <div className="text-sm font-medium text-white mb-1">{tier.name}</div>
                <div className="text-xs text-white/50 space-y-1">
                  <div>{isLangFr ? 'Capital min.' : 'Min. Capital'}: {selectedConfig.currency.symbol} {tier.minCapital.toLocaleString()}</div>
                  <div>CAR: {tier.carRequirement}%</div>
                  {tier.maxLoanPerBorrower && (
                    <div>{isLangFr ? 'Prêt max.' : 'Max Loan'}: {selectedConfig.currency.symbol} {tier.maxLoanPerBorrower.toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {isLangFr ? t('demo.features') : t('demo.features')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">
                    {isLangFr ? feature.titleFr : feature.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    {isLangFr ? feature.descriptionFr : feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            size="lg"
            onClick={handleExploreDemo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            {isLangFr ? t('demo.viewDemo') : t('demo.viewDemo')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-white/40 text-sm">
            {isLangFr
              ? 'Aucune inscription requise. Explorez avec des données de démonstration.'
              : 'No sign-up required. Explore with sample data.'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>&copy; {new Date().getFullYear()} MFI Clarity. {isLangFr ? t('demo.builtFor') : t('demo.builtFor')}.</p>
        </div>
      </footer>
    </div>
  );
}
