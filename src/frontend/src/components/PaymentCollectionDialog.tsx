import { useState, useEffect } from 'react';
import { CustomerRecord } from '../backend';
import { useRecordPayment } from '../hooks/useQueries';
import { useAppRefresh } from '../context/AppRefreshContext';
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
import { IndianRupee } from 'lucide-react';

interface PaymentCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerRecord;
}

export default function PaymentCollectionDialog({
  open,
  onOpenChange,
  customer,
}: PaymentCollectionDialogProps) {
  const [amount, setAmount] = useState('');
  const recordPayment = useRecordPayment();
  const { refreshToken } = useAppRefresh();

  // Clear errors when refresh is triggered
  useEffect(() => {
    if (refreshToken > 0 && open) {
      recordPayment.reset();
    }
  }, [refreshToken, open, recordPayment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    recordPayment.mutate(
      { customerName: customer.name, amount: paymentAmount },
      {
        onSuccess: () => {
          setAmount('');
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!recordPayment.isPending) {
      setAmount('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Record a payment for <strong>{customer.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Outstanding Balance</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-lg font-semibold">
                  {formatCurrency(customer.outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  required
                  disabled={recordPayment.isPending}
                />
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <Label className="text-sm text-muted-foreground">New Balance After Payment</Label>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-lg font-semibold">
                    {formatCurrency(Math.max(0, customer.outstandingBalance - parseFloat(amount)))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={recordPayment.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending || !amount || parseFloat(amount) <= 0}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
