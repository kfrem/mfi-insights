import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganisationDetailsSettings } from '@/components/settings/OrganisationDetailsSettings';
import { OrganisationTierSettings } from '@/components/settings/OrganisationTierSettings';
import { Building2, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organisation settings and preferences
        </p>
      </div>

      <Tabs defaultValue="organisation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organisation" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organisation
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organisation" className="space-y-6">
          <OrganisationDetailsSettings />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <OrganisationTierSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
