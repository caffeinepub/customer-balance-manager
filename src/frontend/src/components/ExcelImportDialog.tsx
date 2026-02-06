import { useState, useEffect } from 'react';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useQueries';
import { useAppRefresh } from '../context/AppRefreshContext';
import { PaymentStatus, CreateCustomer } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedCustomer extends CreateCustomer {
  rowNumber: number;
  error?: string;
}

export default function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { refreshToken } = useAppRefresh();

  // Clear errors when refresh is triggered
  useEffect(() => {
    if (refreshToken > 0 && open) {
      createCustomer.reset();
      updateCustomer.reset();
      setIsProcessing(false);
    }
  }, [refreshToken, open, createCustomer, updateCustomer]);

  const parsePaymentStatus = (status: string): PaymentStatus | null => {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'paid') return PaymentStatus.paid;
    if (normalized === 'partially paid' || normalized === 'partiallypaid') return PaymentStatus.partiallyPaid;
    if (normalized === 'unpaid') return PaymentStatus.unpaid;
    return null;
  };

  const parseCSV = (text: string): ParsedCustomer[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const customers: ParsedCustomer[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
      
      if (parts.length < 4) {
        customers.push({
          name: parts[0] || `Row ${i + 1}`,
          mobileNumber: '',
          balance: 0,
          paymentStatus: PaymentStatus.unpaid,
          rowNumber: i + 1,
          error: 'Invalid format: Expected 4 columns (Name, Mobile Number, Balance, Status)',
        });
        continue;
      }

      const [name, mobileNumber, balanceStr, statusStr] = parts;
      const balance = parseFloat(balanceStr);
      const paymentStatus = parsePaymentStatus(statusStr);

      const customer: ParsedCustomer = {
        name: name || `Customer ${i + 1}`,
        mobileNumber: mobileNumber || '',
        balance: isNaN(balance) ? 0 : balance,
        paymentStatus: paymentStatus || PaymentStatus.unpaid,
        rowNumber: i + 1,
      };

      if (!name) {
        customer.error = 'Customer name is required';
      } else if (!mobileNumber) {
        customer.error = 'Mobile number is required';
      } else if (isNaN(balance)) {
        customer.error = 'Invalid balance amount';
      } else if (!paymentStatus) {
        customer.error = 'Invalid payment status (use: Paid, Partially Paid, or Unpaid)';
      }

      customers.push(customer);
    }

    return customers;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setStep('upload');
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setStep('confirm');
    } catch (error) {
      toast.error('Failed to parse file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validCustomers = parsedData.filter((c) => !c.error);
    if (validCustomers.length === 0) {
      toast.error('No valid customers to import');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const customer of validCustomers) {
      try {
        await createCustomer.mutateAsync({
          name: customer.name,
          mobileNumber: customer.mobileNumber,
          balance: customer.balance,
          paymentStatus: customer.paymentStatus,
        });
        successCount++;
      } catch (error: any) {
        // If customer exists, try updating
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          try {
            await updateCustomer.mutateAsync({
              name: customer.name,
              updated: {
                name: customer.name,
                mobileNumber: customer.mobileNumber,
                balance: customer.balance,
                paymentStatus: customer.paymentStatus,
              },
            });
            successCount++;
          } catch {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} customer(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} customer(s)`);
    }

    onOpenChange(false);
    resetDialog();
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Mobile Number,Outstanding Balance (₹),Payment Status\nJohn Doe,+91 98765 43210,1500.00,Unpaid\nJane Smith,+91 98765 43211,2500.50,Partially Paid\nBob Johnson,+91 98765 43212,0.00,Paid';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'customer_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setStep('upload');
  };

  const validCount = parsedData.filter((c) => !c.error).length;
  const errorCount = parsedData.filter((c) => c.error).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetDialog();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Customers from Excel</DialogTitle>
          <DialogDescription>
            Upload a CSV file with customer data or download the template to get started.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <strong>CSV Format:</strong> Name, Mobile Number, Outstanding Balance (₹), Payment Status
                <br />
                <strong>Example:</strong> John Doe, +91 98765 43210, 1500.00, Unpaid
                <br />
                <strong>Valid Statuses:</strong> Paid, Partially Paid, Unpaid
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <p className="text-sm font-medium">Need a template?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Download our Excel template with the correct format and sample data
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Fill in the template with your customer data and upload it here
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">
                    {validCount} valid customer{validCount !== 1 ? 's' : ''}
                  </p>
                  {errorCount > 0 && (
                    <p className="text-sm text-destructive">
                      {errorCount} row{errorCount !== 1 ? 's' : ''} with errors
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((customer) => (
                    <TableRow key={customer.rowNumber}>
                      <TableCell className="font-mono text-xs">{customer.rowNumber}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.mobileNumber || '—'}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(customer.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.error ? 'destructive' : 'default'}>
                          {customer.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.error ? (
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">{customer.error}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Valid</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 'confirm') {
                setStep('upload');
              } else {
                onOpenChange(false);
                resetDialog();
              }
            }}
            disabled={isProcessing}
          >
            {step === 'confirm' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'upload' ? (
            <Button onClick={handleParse} disabled={!file || isProcessing} className="gap-2">
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Parse File
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={validCount === 0 || isProcessing} className="gap-2">
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Import {validCount} Customer{validCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
