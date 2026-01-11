import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldCollectionForm } from '@/components/field/FieldCollectionForm';
import { FieldCollectionsList } from '@/components/field/FieldCollectionsList';
import { MapPin, ClipboardList, PlusCircle, History } from 'lucide-react';

export default function FieldOperations() {
  return (
    <div className="p-8">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <div>
            <h1 className="page-title">Field Operations</h1>
            <p className="page-subtitle">Mobile collections with GPS tracking and digital evidence</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Collections Queue
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Collection
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            All History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <FieldCollectionsList filter="pending" canVerify />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <FieldCollectionForm />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <FieldCollectionsList filter="all" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
