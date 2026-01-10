-- Create storage bucket for client documents (paper forms, scans, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create table to track and search client documents
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL, -- e.g., 'loan_application', 'id_copy', 'payslip', 'utility_bill', 'guarantor_form'
  description TEXT,
  tags TEXT[], -- searchable tags like ['2024', 'personal_loan', 'approved']
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_size_bytes INTEGER,
  mime_type TEXT
);

-- Create indexes for fast searching
CREATE INDEX idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX idx_client_documents_org_id ON public.client_documents(org_id);
CREATE INDEX idx_client_documents_document_type ON public.client_documents(document_type);
CREATE INDEX idx_client_documents_tags ON public.client_documents USING GIN(tags);
CREATE INDEX idx_client_documents_file_name ON public.client_documents USING GIN(to_tsvector('english', file_name));
CREATE INDEX idx_client_documents_description ON public.client_documents USING GIN(to_tsvector('english', COALESCE(description, '')));

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_documents
CREATE POLICY "Users can view documents in their org"
ON public.client_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can upload documents"
ON public.client_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their uploaded documents"
ON public.client_documents FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their uploaded documents"
ON public.client_documents FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);

-- Storage policies for client-documents bucket
CREATE POLICY "Authenticated users can view client documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

CREATE POLICY "Users can update their uploaded files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents');

CREATE POLICY "Users can delete their uploaded files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');