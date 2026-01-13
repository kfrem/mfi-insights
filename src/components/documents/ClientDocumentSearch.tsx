import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, FileText, Download, Eye, Loader2, FolderOpen } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'loan_application', label: 'Loan Application Form' },
  { value: 'id_copy', label: 'ID Copy (Ghana Card)' },
  { value: 'payslip', label: 'Payslip / Income Proof' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'guarantor_form', label: 'Guarantor Form' },
  { value: 'collateral_docs', label: 'Collateral Documents' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'business_registration', label: 'Business Registration' },
  { value: 'other', label: 'Other Document' },
];

interface DocumentResult {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  description: string | null;
  tags: string[] | null;
  uploaded_at: string;
  file_size_bytes: number | null;
}

export function ClientDocumentSearch() {
  const { selectedOrgId } = useOrganisation();
  const [searchQuery, setSearchQuery] = useState('');
  const [documentType, setDocumentType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organisation');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('client_documents')
        .select('*')
        .eq('org_id', selectedOrgId)
        .order('uploaded_at', { ascending: false });

      // Filter by document type
      if (documentType !== 'all') {
        query = query.eq('document_type', documentType);
      }

      // Text search in file name, description, or tags
      if (searchQuery.trim()) {
        query = query.or(
          `file_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery.toLowerCase()}}`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setResults(data || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search documents');
    } finally {
      setIsSearching(false);
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

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

      // Create download link
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

  const getDocumentTypeLabel = (value: string) => {
    return DOCUMENT_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Client Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, description, or tags..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {/* Results */}
        {hasSearched && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents found</p>
                <p className="text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {results.length} document{results.length !== 1 ? 's' : ''}
                </p>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium truncate max-w-[200px]">
                                  {doc.file_name}
                                </p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDocumentTypeLabel(doc.document_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {doc.tags && doc.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{doc.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatFileSize(doc.file_size_bytes)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(new Date(doc.uploaded_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(doc.file_path)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(doc.file_path, doc.file_name)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
