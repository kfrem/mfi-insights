import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  UserPlus,
  Building2,
  CreditCard,
  Banknote,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  allTemplates,
  downloadTemplate,
  ImportTemplate,
} from '@/lib/bulkImportTemplates';

const templateIcons: Record<string, React.ReactNode> = {
  'Individual Clients': <UserPlus className="h-5 w-5" />,
  'Groups & Cooperatives': <Building2 className="h-5 w-5" />,
  'Group Members': <Users className="h-5 w-5" />,
  'Loan Applications': <CreditCard className="h-5 w-5" />,
  'Repayments': <Banknote className="h-5 w-5" />,
};

function TemplatePreviewDialog({ template }: { template: ImportTemplate }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{template.name} Template</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
                <TableHead>Valid Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.columns.map((col) => (
                <TableRow key={col.header}>
                  <TableCell className="font-mono text-sm">{col.header}</TableCell>
                  <TableCell>
                    {col.required ? (
                      <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Optional
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{col.description}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {col.example}
                  </TableCell>
                  <TableCell>
                    {col.validValues ? (
                      <div className="flex flex-wrap gap-1">
                        {col.validValues.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Any text</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function BulkImportTemplates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bulk Import Templates</h2>
          <p className="text-sm text-muted-foreground">
            Download templates, fill in your data, and import for bulk data entry
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allTemplates.map((template) => (
          <Card key={template.name} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {templateIcons[template.name] || <FileSpreadsheet className="h-5 w-5" />}
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {template.columns.filter((c) => c.required).length} required
                </Badge>
              </div>
              <CardDescription className="text-xs mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TemplatePreviewDialog template={template} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(template, 'csv')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => downloadTemplate(template, 'excel')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import Instructions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How to Use Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">1</Badge>
            <p><strong>Download</strong> the appropriate template (CSV for simple data, Excel for guidance)</p>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">2</Badge>
            <p><strong>Fill in</strong> your data following the column headers. The first row in Excel shows descriptions.</p>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">3</Badge>
            <p><strong>Validate</strong> all required fields are filled and values match allowed options (e.g., gender must be M or F)</p>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">4</Badge>
            <p><strong>Save as CSV</strong> and use the Import function to upload your data</p>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-amber-900 dark:text-amber-100">
          <ul className="list-disc list-inside space-y-1">
            <li>Ghana Card format must be <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">GHA-XXXXXXXXX-X</code></li>
            <li>Dates must be in <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">YYYY-MM-DD</code> format</li>
            <li>Nationality can be any country (e.g., Ghanaian, Nigerian, Togolese)</li>
            <li>For group members, use the primary contact's Ghana Card to link them to the correct group</li>
            <li>Loan imports require clients to exist first - create clients before importing loans</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
