import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateClientForm } from '@/components/forms/CreateClientForm';
import { CreateLoanForm } from '@/components/forms/CreateLoanForm';
import { PostRepaymentForm } from '@/components/forms/PostRepaymentForm';
import { ClientListView } from '@/components/clients/ClientListView';
import { ClientDocumentUpload } from '@/components/documents/ClientDocumentUpload';
import { ClientDocumentSearch } from '@/components/documents/ClientDocumentSearch';
import { OrganisationTierSettings } from '@/components/settings/OrganisationTierSettings';
import { LoanWorkflowPanel } from '@/components/loans/LoanWorkflowPanel';
import { BulkImportTemplates } from '@/components/data-entry/BulkImportTemplates';
import { UserPlus, FileText, DollarSign, Users, Upload, Search, Settings, GitBranch, Download } from 'lucide-react';

export default function DataEntry() {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="page-header">
        <h1 className="page-title">Data Entry</h1>
        <p className="page-subtitle">Manage clients, disburse loans, and post repayments</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4 md:mb-8">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-9">
            <TabsTrigger value="clients" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <Users className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="new-client" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">New Client</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <Download className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="loan" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Loan</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <GitBranch className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="repayment" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Repayment</span>
            </TabsTrigger>
            <TabsTrigger value="upload-doc" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="search-docs" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Find Docs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="clients" className="animate-fade-in">
          <ClientListView />
        </TabsContent>

        <TabsContent value="new-client" className="animate-fade-in">
          <CreateClientForm />
        </TabsContent>

        <TabsContent value="templates" className="animate-fade-in">
          <BulkImportTemplates />
        </TabsContent>

        <TabsContent value="loan" className="animate-fade-in">
          <CreateLoanForm />
        </TabsContent>

        <TabsContent value="workflow" className="animate-fade-in">
          <LoanWorkflowPanel />
        </TabsContent>

        <TabsContent value="repayment" className="animate-fade-in">
          <PostRepaymentForm />
        </TabsContent>

        <TabsContent value="upload-doc" className="animate-fade-in">
          <ClientDocumentUpload />
        </TabsContent>

        <TabsContent value="search-docs" className="animate-fade-in">
          <ClientDocumentSearch />
        </TabsContent>

        <TabsContent value="settings" className="animate-fade-in">
          <OrganisationTierSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
