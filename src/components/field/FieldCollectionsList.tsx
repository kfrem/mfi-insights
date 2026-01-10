import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Check, X, Eye, Image, PenTool, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFieldCollections, useVerifyFieldCollection } from '@/hooks/useFieldCollection';
import { CollectionStatus } from '@/types/audit';

interface FieldCollectionsListProps {
  orgId: string;
  canVerify?: boolean;
}

export function FieldCollectionsList({ orgId, canVerify = false }: FieldCollectionsListProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<typeof collections.data[0] | null>(null);

  const collections = useFieldCollections(orgId);
  const verifyCollection = useVerifyFieldCollection();

  const handleVerify = async () => {
    if (!selectedCollection || !verifyAction) return;

    await verifyCollection.mutateAsync({
      collectionId: selectedCollection,
      status: verifyAction,
      rejectionReason: verifyAction === 'REJECTED' ? rejectionReason : undefined,
    });

    setSelectedCollection(null);
    setVerifyAction(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: CollectionStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
    }
  };

  const getMethodBadge = (method: string | null) => {
    switch (method) {
      case 'CASH':
        return <Badge variant="secondary">Cash</Badge>;
      case 'MOBILE_MONEY':
        return <Badge variant="secondary">MoMo</Badge>;
      case 'BANK_TRANSFER':
        return <Badge variant="secondary">Bank</Badge>;
      default:
        return null;
    }
  };

  if (collections.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading collections...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Field Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.data?.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell className="font-medium">
                    {format(new Date(collection.collection_date), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {collection.clients 
                      ? `${collection.clients.first_name} ${collection.clients.last_name}`
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="font-mono">
                    GH₵{collection.amount_collected.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getMethodBadge(collection.collection_method)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {collection.latitude && (
                        <MapPin className="h-4 w-4 text-green-600" />
                      )}
                      {collection.receipt_photo_url && (
                        <Image className="h-4 w-4 text-blue-600" />
                      )}
                      {collection.signature_url && (
                        <PenTool className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(collection.status as CollectionStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetails(collection);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canVerify && collection.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => {
                              setSelectedCollection(collection.id);
                              setVerifyAction('VERIFIED');
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedCollection(collection.id);
                              setVerifyAction('REJECTED');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!collections.data || collections.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No field collections recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={!!verifyAction} onOpenChange={() => {
        setVerifyAction(null);
        setSelectedCollection(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyAction === 'VERIFIED' ? 'Verify Collection' : 'Reject Collection'}
            </DialogTitle>
            <DialogDescription>
              {verifyAction === 'VERIFIED'
                ? 'Confirm that this field collection is valid and should be processed.'
                : 'Provide a reason for rejecting this collection.'}
            </DialogDescription>
          </DialogHeader>
          
          {verifyAction === 'REJECTED' && (
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              variant={verifyAction === 'VERIFIED' ? 'default' : 'destructive'}
              disabled={verifyAction === 'REJECTED' && !rejectionReason}
            >
              {verifyAction === 'VERIFIED' ? 'Verify' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Collection Details</DialogTitle>
          </DialogHeader>
          
          {selectedDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {selectedDetails.clients 
                      ? `${selectedDetails.clients.first_name} ${selectedDetails.clients.last_name}`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium font-mono">GH₵{selectedDetails.amount_collected.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedDetails.collection_date), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium">{selectedDetails.collection_method}</p>
                </div>
                {selectedDetails.mobile_money_reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">MoMo Reference</p>
                    <p className="font-medium font-mono">{selectedDetails.mobile_money_reference}</p>
                  </div>
                )}
                {selectedDetails.latitude && selectedDetails.longitude && (
                  <div>
                    <p className="text-sm text-muted-foreground">GPS Location</p>
                    <p className="font-medium text-sm">
                      {selectedDetails.latitude.toFixed(6)}, {selectedDetails.longitude.toFixed(6)}
                      {selectedDetails.location_accuracy && ` (±${selectedDetails.location_accuracy.toFixed(0)}m)`}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence Images */}
              <div className="grid grid-cols-2 gap-4">
                {selectedDetails.receipt_photo_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Receipt Photo</p>
                    <img 
                      src={selectedDetails.receipt_photo_url} 
                      alt="Receipt" 
                      className="rounded-lg border max-h-48 object-cover"
                    />
                  </div>
                )}
                {selectedDetails.signature_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Client Signature</p>
                    <img 
                      src={selectedDetails.signature_url} 
                      alt="Signature" 
                      className="rounded-lg border max-h-48 object-cover bg-white"
                    />
                  </div>
                )}
              </div>

              {selectedDetails.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{selectedDetails.notes}</p>
                </div>
              )}

              {selectedDetails.rejection_reason && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Rejection Reason</p>
                  <p className="text-red-600">{selectedDetails.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
