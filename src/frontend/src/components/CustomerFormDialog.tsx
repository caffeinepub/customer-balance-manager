import { useState, useEffect } from 'react';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useQueries';
import { useAppRefresh } from '../context/AppRefreshContext';
import { CustomerRecord, PaymentStatus } from '../backend';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  customer?: CustomerRecord;
}

export default function CustomerFormDialog({
  open,
  onOpenChange,
  mode,
  customer,
}: CustomerFormDialogProps) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.unpaid);
  const [validationError, setValidationError] = useState<string>('');
  const [backendError, setBackendError] = useState<string>('');

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { refreshToken } = useAppRefresh();

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setName(customer.name);
      setMobileNumber(customer.mobileNumber);
      setBalance(customer.outstandingBalance.toString());
      setPaymentStatus(customer.paymentStatus);
    } else {
      setName('');
      setMobileNumber('');
      setBalance('');
      setPaymentStatus(PaymentStatus.unpaid);
    }
    // Clear errors when dialog opens/closes or mode changes
    setValidationError('');
    setBackendError('');
  }, [mode, customer, open]);

  // Clear errors when refresh is triggered
  useEffect(() => {
    if (refreshToken > 0 && open) {
      setValidationError('');
      setBackendError('');
      createCustomer.reset();
      updateCustomer.reset();
    }
  }, [refreshToken, open, createCustomer, updateCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setValidationError('');
    setBackendError('');

    // Validate balance
    if (!balance.trim()) {
      setValidationError('Please enter a balance amount.');
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      setValidationError('Balance must be a valid number.');
      return;
    }

    if (balanceNum < 0) {
      setValidationError('Balance cannot be negative.');
      return;
    }

    const customerData = {
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      balance: balanceNum,
      paymentStatus,
    };

    try {
      if (mode === 'create') {
        await createCustomer.mutateAsync(customerData);
        onOpenChange(false);
      } else if (customer) {
        await updateCustomer.mutateAsync({ name: customer.name, updated: customerData });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      // Display backend error in the dialog
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      setBackendError(errorMessage);
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;
  const hasError = validationError || backendError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Customer' : 'Edit Customer'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Enter the customer details to add them to your balance tracker.'
              : 'Update the customer information below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError || backendError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">Customer name cannot be changed</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="+91 98765 43210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Outstanding Balance (₹)</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.paid}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.partiallyPaid}>Partially Paid</SelectItem>
                  <SelectItem value={PaymentStatus.unpaid}>Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !mobileNumber.trim() || !balance}>
              {isPending ? 'Saving...' : mode === 'create' ? 'Add Customer' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
