import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateClientForm } from '@/components/forms/CreateClientForm';
import { CreateLoanForm } from '@/components/forms/CreateLoanForm';
import { PostRepaymentForm } from '@/components/forms/PostRepaymentForm';
import { ClientListView } from '@/components/clients/ClientListView';
import { UserPlus, FileText, DollarSign, Users } from 'lucide-react';

export default function DataEntry() {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="p-8">
      <header className="page-header">
        <h1 className="page-title">Data Entry</h1>
        <p className="page-subtitle">Manage clients, disburse loans, and post repayments</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="new-client" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </TabsTrigger>
          <TabsTrigger value="loan" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Loan
          </TabsTrigger>
          <TabsTrigger value="repayment" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Repayment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="animate-fade-in">
          <ClientListView />
        </TabsContent>

        <TabsContent value="new-client" className="animate-fade-in">
          <CreateClientForm />
        </TabsContent>

        <TabsContent value="loan" className="animate-fade-in">
          <CreateLoanForm />
        </TabsContent>

        <TabsContent value="repayment" className="animate-fade-in">
          <PostRepaymentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
