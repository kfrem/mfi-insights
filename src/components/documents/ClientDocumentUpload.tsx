import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClientSearchSelect } from '@/components/forms/ClientSearchSelect';
import { useClients } from '@/hooks/useMfiData';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

const DEFAULT_DOC_TYPE = 'other';

interface UploadFormData {
  client_id: string;
  description: string;
}

interface FileWithStatus {
  file: File;
  documentType: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function ClientDocumentUpload() {
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { user } = useAuth();
  const { selectedOrgId } = useOrganisation();
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [defaultDocType, setDefaultDocType] = useState(DEFAULT_DOC_TYPE);

  const { register, handleSubmit, setValue, watch, reset } = useForm<UploadFormData>();
  const selectedClientId = watch('client_id');

  const selectedClient = clients.find(c => c.client_id === selectedClientId);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const addFiles = (files: File[]) => {
    const validFiles: FileWithStatus[] = [];
    
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB limit`);
        continue;
      }
      // Check file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }
      // Check for duplicates
      if (selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast.error(`${file.name} is already added`);
        continue;
      }
      validFiles.push({ 
        file, 
        documentType: defaultDocType,
        status: 'pending' 
      });
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (isUploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileDocType = (index: number, docType: string) => {
    setSelectedFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, documentType: docType } : f
    ));
  };

  const applyDocTypeToAll = () => {
    setSelectedFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, documentType: defaultDocType } : f
    ));
    toast.success('Document type applied to all pending files');
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getDocTypeLabel = (value: string) => {
    return DOCUMENT_TYPES.find(t => t.value === value)?.label || value;
  };

  const onSubmit = async (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!user?.id || !selectedOrgId) {
      toast.error('Authentication required');
      return;
    }

    // Check all files have document types
    const filesWithoutType = selectedFiles.filter(f => !f.documentType);
    if (filesWithoutType.length > 0) {
      toast.error('Please assign a document type to all files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.length;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileItem = selectedFiles[i];
      
      // Update status to uploading
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ));

      try {
        const timestamp = Date.now();
        const filePath = `${selectedOrgId}/${data.client_id}/${timestamp}_${fileItem.file.name}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, fileItem.file);

        if (uploadError) throw uploadError;

        // Create document record with individual document type
        const { error: insertError } = await supabase
          .from('client_documents')
          .insert({
            client_id: data.client_id,
            org_id: selectedOrgId,
            file_name: fileItem.file.name,
            file_path: filePath,
            document_type: fileItem.documentType,
            description: data.description || null,
            tags: tags.length > 0 ? tags : null,
            uploaded_by: user.id,
            file_size_bytes: fileItem.file.size,
            mime_type: fileItem.file.type,
          });

        if (insertError) throw insertError;

        // Update status to success
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' } : f
        ));
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        // Update status to error
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: error.message } : f
        ));
        errorCount++;
      }

      // Update progress
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setIsUploading(false);

    if (successCount === totalFiles) {
      toast.success(`All ${totalFiles} document${totalFiles > 1 ? 's' : ''} uploaded successfully!`);
      // Reset form
      reset();
      setSelectedFiles([]);
      setTags([]);
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${totalFiles} documents uploaded. ${errorCount} failed.`);
    } else {
      toast.error('All uploads failed. Please try again.');
    }
  };

  const pendingFiles = selectedFiles.filter(f => f.status === 'pending' || f.status === 'uploading');
  const hasFiles = selectedFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Client Documents
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

          {/* Default Document Type */}
          <div className="space-y-2">
            <Label>Default Document Type</Label>
            <div className="flex gap-2">
              <Select value={defaultDocType} onValueChange={setDefaultDocType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select default type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFiles && pendingFiles.length > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={applyDocTypeToAll}
                  disabled={isUploading}
                >
                  Apply to All
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              New files will use this type. You can change each file's type individually below.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Files * (Multiple allowed)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-primary/50'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                id="file-upload"
                multiple
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className={isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <Upload className={`h-10 w-10 mx-auto mb-2 transition-colors ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm transition-colors ${isDragOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, DOCX (max 20MB each)
                </p>
              </label>
            </div>

            {/* Selected Files List */}
            {hasFiles && (
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <div className="max-h-72 overflow-y-auto space-y-3">
                  {selectedFiles.map((fileItem, index) => (
                    <div 
                      key={`${fileItem.file.name}-${index}`}
                      className="flex flex-col gap-2 p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                        {fileItem.status === 'pending' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {fileItem.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                        )}
                        {fileItem.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        {fileItem.status === 'error' && (
                          <span title={fileItem.error}>
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      
                      {/* Per-file document type selector */}
                      {fileItem.status === 'pending' && (
                        <Select 
                          value={fileItem.documentType} 
                          onValueChange={(value) => updateFileDocType(index, value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="text-xs">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {/* Show document type for non-pending files */}
                      {fileItem.status !== 'pending' && (
                        <Badge variant="outline" className="w-fit text-xs">
                          {getDocTypeLabel(fileItem.documentType)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional - applies to all files)</Label>
            <Textarea
              {...register('description')}
              placeholder="Add notes about these documents..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional - applies to all files)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags for easy searching..."
                disabled={isUploading}
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={isUploading}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} disabled={isUploading}>
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
            disabled={isUploading || !selectedClientId || pendingFiles.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading {selectedFiles.filter(f => f.status === 'success').length + 1} of {selectedFiles.length}...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {pendingFiles.length} Document{pendingFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
