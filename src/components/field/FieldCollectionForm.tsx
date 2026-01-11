import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Camera, PenTool, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateFieldCollection, useGeolocation } from '@/hooks/useFieldCollection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CollectionMethod } from '@/types/audit';
import { useClients } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';

const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  loan_id: z.string().min(1, 'Loan is required'),
  amount_collected: z.coerce.number().positive('Amount must be positive'),
  collection_method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER']),
  mobile_money_reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FieldCollectionFormProps {
  onSuccess?: () => void;
}

export function FieldCollectionForm({ onSuccess }: FieldCollectionFormProps) {
  const { selectedOrgId: orgId } = useOrganisation();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [clientLoans, setClientLoans] = useState<Array<{
    loan_id: string;
    principal: number;
    outstanding_principal: number | null;
    loan_type: string;
  }>>([]);

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const { getLocation } = useGeolocation();
  const createCollection = useCreateFieldCollection();
  const { data: clients, isLoading: clientsLoading } = useClients();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: '',
      loan_id: '',
      amount_collected: 0,
      collection_method: 'CASH',
      mobile_money_reference: '',
      notes: '',
    },
  });

  const collectionMethod = form.watch('collection_method');

  const handleCaptureLocation = async () => {
    setLocationLoading(true);
    try {
      const loc = await getLocation();
      setLocation(loc);
      toast.success('Location captured successfully');
    } catch (error) {
      toast.error('Failed to capture location. Please enable GPS.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleClientSelect = async (clientId: string) => {
    form.setValue('client_id', clientId);
    form.setValue('loan_id', '');
    
    // Fetch active loans for this client
    const { data: loans, error } = await supabase
      .from('loans')
      .select('loan_id, principal, outstanding_principal, loan_type')
      .eq('client_id', clientId)
      .eq('org_id', orgId)
      .in('status', ['ACTIVE', 'DISBURSED']);

    if (error) {
      toast.error('Failed to fetch client loans');
      return;
    }

    setClientLoans(loans || []);
  };

  const handleFileUpload = async (file: File, type: 'receipt' | 'signature') => {
    const setUploading = type === 'receipt' ? setUploadingReceipt : setUploadingSignature;
    const setUrl = type === 'receipt' ? setReceiptPhotoUrl : setSignatureUrl;

    setUploading(true);
    try {
      const fileName = `${orgId}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('field-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('field-evidence')
        .getPublicUrl(fileName);

      setUrl(publicUrl);
      toast.success(`${type === 'receipt' ? 'Receipt' : 'Signature'} uploaded`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!location) {
      toast.error('Please capture your location first');
      return;
    }

    await createCollection.mutateAsync({
      org_id: orgId,
      client_id: values.client_id,
      loan_id: values.loan_id,
      amount_collected: values.amount_collected,
      collection_method: values.collection_method as CollectionMethod,
      mobile_money_reference: values.mobile_money_reference,
      notes: values.notes,
      latitude: location.latitude,
      longitude: location.longitude,
      location_accuracy: location.accuracy,
      receipt_photo_url: receiptPhotoUrl || undefined,
      signature_url: signatureUrl || undefined,
    });

    form.reset();
    setLocation(null);
    setReceiptPhotoUrl(null);
    setSignatureUrl(null);
    setClientLoans([]);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Record Field Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select 
                    onValueChange={handleClientSelect} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select client"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.filter(c => c.org_id === orgId).map((client) => (
                        <SelectItem key={client.client_id} value={client.client_id}>
                          {client.first_name} {client.last_name} - {client.ghana_card_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Selection */}
            {clientLoans.length > 0 && (
              <FormField
                control={form.control}
                name="loan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientLoans.map((loan) => (
                          <SelectItem key={loan.loan_id} value={loan.loan_id}>
                            {loan.loan_type} - GH₵{loan.outstanding_principal?.toLocaleString() || loan.principal.toLocaleString()} outstanding
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount_collected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Collected (GH₵)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collection Method */}
            <FormField
              control={form.control}
              name="collection_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Money Reference */}
            {collectionMethod === 'MOBILE_MONEY' && (
              <FormField
                control={form.control}
                name="mobile_money_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Money Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Location Capture */}
            <div className="space-y-2">
              <FormLabel>Location</FormLabel>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={location ? 'secondary' : 'outline'}
                  onClick={handleCaptureLocation}
                  disabled={locationLoading}
                  className="flex-1"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : location ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  {location ? 'Location Captured' : 'Capture GPS Location'}
                </Button>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} (±{location.accuracy.toFixed(0)}m)
                </p>
              )}
            </div>

            {/* Evidence Upload */}
            <div className="grid grid-cols-2 gap-4">
              {/* Receipt Photo */}
              <div className="space-y-2">
                <FormLabel>Receipt Photo</FormLabel>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'receipt');
                  }}
                />
                <Button
                  type="button"
                  variant={receiptPhotoUrl ? 'secondary' : 'outline'}
                  onClick={() => receiptInputRef.current?.click()}
                  disabled={uploadingReceipt}
                  className="w-full"
                >
                  {uploadingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : receiptPhotoUrl ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {receiptPhotoUrl ? 'Photo Added' : 'Take Photo'}
                </Button>
              </div>

              {/* Signature */}
              <div className="space-y-2">
                <FormLabel>Client Signature</FormLabel>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'signature');
                  }}
                />
                <Button
                  type="button"
                  variant={signatureUrl ? 'secondary' : 'outline'}
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                  className="w-full"
                >
                  {uploadingSignature ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : signatureUrl ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <PenTool className="h-4 w-4 mr-2" />
                  )}
                  {signatureUrl ? 'Signature Added' : 'Capture Signature'}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createCollection.isPending || !location}
            >
              {createCollection.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Collection
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
