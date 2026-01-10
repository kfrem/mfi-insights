import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClientSearchSelect } from '@/components/forms/ClientSearchSelect';
import { useClients } from '@/hooks/useMfiData';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

const DOCUMENT_TYPES = [
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

interface UploadFormData {
  client_id: string;
  document_type: string;
  description: string;
  tags: string;
}

export function ClientDocumentUpload() {
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { user } = useAuth();
  const { selectedOrgId } = useOrganisation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<UploadFormData>();
  const selectedClientId = watch('client_id');
  const selectedDocType = watch('document_type');

  const selectedClient = clients.find(c => c.client_id === selectedClientId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!user?.id || !selectedOrgId) {
      toast.error('Authentication required');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${selectedOrgId}/${data.client_id}/${timestamp}_${selectedFile.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: insertError } = await supabase
        .from('client_documents')
        .insert({
          client_id: data.client_id,
          org_id: selectedOrgId,
          file_name: selectedFile.name,
          file_path: filePath,
          document_type: data.document_type,
          description: data.description || null,
          tags: tags.length > 0 ? tags : null,
          uploaded_by: user.id,
          file_size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
        });

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully!');
      
      // Reset form
      reset();
      setSelectedFile(null);
      setTags([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Client Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Select Client *</Label>
            <ClientSearchSelect
              clients={clients}
              isLoading={isLoadingClients}
              value={selectedClientId || ''}
              onValueChange={(value) => setValue('client_id', value)}
            />
            {selectedClient && (
              <p className="text-sm text-muted-foreground">
                Ghana Card: {selectedClient.ghana_card_number}
              </p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <Select onValueChange={(value) => setValue('document_type', value)} value={selectedDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG, DOCX (max 20MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              {...register('description')}
              placeholder="Add notes about this document..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags for easy searching..."
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || !selectedClientId || !selectedDocType || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
