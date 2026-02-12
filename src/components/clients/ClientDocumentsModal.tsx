import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { FileText, Download, Eye, FolderOpen, Calendar, Tag } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import type { Client } from '@/types/mfi';

const DOCUMENT_TYPES: Record<string, string> = {
  loan_application: 'Loan Application Form',
  id_copy: 'ID Copy (Ghana Card)',
  payslip: 'Payslip / Income Proof',
  utility_bill: 'Utility Bill',
  guarantor_form: 'Guarantor Form',
  collateral_docs: 'Collateral Documents',
  bank_statement: 'Bank Statement',
  business_registration: 'Business Registration',
  other: 'Other Document',
};

interface DocumentResult {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  description: string | null;
  tags: string[] | null;
  uploaded_at: string;
  file_size_bytes: number | null;
}

interface ClientDocumentsModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDocumentsModal({ client, open, onOpenChange }: ClientDocumentsModalProps) {
  const { selectedOrgId } = useOrganisation();
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && client && selectedOrgId) {
      fetchDocuments();
    }
  }, [open, client, selectedOrgId]);

  const fetchDocuments = async () => {
    if (!client || !selectedOrgId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', client.client_id)
        .eq('org_id', selectedOrgId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      logger.error('Error fetching documents', 'ClientDocumentsModal', { error: error?.message || String(error) });
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 60 * 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast.error('Failed to open document');
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getDocTypeLabel = (value: string) => DOCUMENT_TYPES[value] || value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents for {client?.first_name} {client?.last_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No documents found</p>
            <p className="text-sm mt-1">
              Upload documents for this client from the "Upload Doc" tab
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.file_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.file_size_bytes)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(new Date(doc.uploaded_at), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleView(doc.file_path)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc.file_path, doc.file_name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeLabel(doc.document_type)}
                    </Badge>
                    {doc.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {doc.description && (
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
