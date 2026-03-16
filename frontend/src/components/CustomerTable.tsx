import { useState } from 'react';
import { CustomerRecord } from '../backend';
import { useDeleteCustomer } from '../hooks/useQueries';
import CustomerFormDialog from './CustomerFormDialog';
import PaymentCollectionDialog from './PaymentCollectionDialog';
import WhatsAppMessageDialog from './WhatsAppMessageDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, IndianRupee, MessageCircle } from 'lucide-react';
import { PaymentStatus } from '../backend';
import { toast } from 'sonner';
import {
  validateWhatsAppEligibility,
  generateWhatsAppLink,
  formatOutstandingMessage,
} from '../utils/whatsapp';

interface CustomerTableProps {
  customers: CustomerRecord[];
  isLoading: boolean;
}

export default function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRecord | null>(null);
  const [collectingPaymentCustomer, setCollectingPaymentCustomer] = useState<CustomerRecord | null>(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState<CustomerRecord | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const deleteCustomer = useDeleteCustomer();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.paid:
        return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400">Paid</Badge>;
      case PaymentStatus.partiallyPaid:
        return <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400">Partially Paid</Badge>;
      case PaymentStatus.unpaid:
        return <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400">Unpaid</Badge>;
    }
  };

  const handleDelete = () => {
    if (deletingCustomer) {
      deleteCustomer.mutate(deletingCustomer.name, {
        onSuccess: () => setDeletingCustomer(null),
      });
    }
  };

  const handleSendWhatsApp = (customer: CustomerRecord) => {
    const validation = validateWhatsAppEligibility(
      customer.mobileNumber,
      customer.outstandingBalance
    );

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Prepare the default message and open the edit dialog
    const message = formatOutstandingMessage(customer.name, customer.outstandingBalance);
    setWhatsappMessage(message);
    setWhatsappCustomer(customer);
  };

  const handleConfirmWhatsApp = (editedMessage: string) => {
    if (!whatsappCustomer) return;

    const whatsappUrl = generateWhatsAppLink(whatsappCustomer.mobileNumber, editedMessage);
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Reset state
    setWhatsappCustomer(null);
    setWhatsappMessage('');
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold">No customers found</h3>
          <p className="text-sm text-muted-foreground">
            Add your first customer or import from Excel to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.name}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.mobileNumber || '—'}
                </TableCell>
                <TableCell className="font-mono text-base">
                  {formatCurrency(customer.outstandingBalance)}
                </TableCell>
                <TableCell>{getStatusBadge(customer.paymentStatus)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSendWhatsApp(customer)}
                        className="gap-2"
                        disabled={
                          !customer.mobileNumber ||
                          customer.mobileNumber.trim() === '' ||
                          customer.outstandingBalance <= 0
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                        Send outstanding via WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCollectingPaymentCustomer(customer)}
                        className="gap-2"
                        disabled={customer.outstandingBalance <= 0}
                      >
                        <IndianRupee className="h-4 w-4" />
                        Collect Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingCustomer(customer)} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingCustomer(customer)}
                        className="gap-2 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCustomer && (
        <CustomerFormDialog
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          mode="edit"
          customer={editingCustomer}
        />
      )}

      {collectingPaymentCustomer && (
        <PaymentCollectionDialog
          open={!!collectingPaymentCustomer}
          onOpenChange={(open) => !open && setCollectingPaymentCustomer(null)}
          customer={collectingPaymentCustomer}
        />
      )}

      {whatsappCustomer && (
        <WhatsAppMessageDialog
          open={!!whatsappCustomer}
          onOpenChange={(open) => !open && setWhatsappCustomer(null)}
          defaultMessage={whatsappMessage}
          onConfirm={handleConfirmWhatsApp}
        />
      )}

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCustomer?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
