import { useState, useMemo } from 'react';
import { useGetAllCustomers, useGetBalancesSum, useDeleteAllCustomers, useGetTotalCollectedPayments } from '../hooks/useQueries';
import CustomerTable from './CustomerTable';
import CustomerFormDialog from './CustomerFormDialog';
import ExcelImportDialog from './ExcelImportDialog';
import StatsCards from './StatsCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus, Search, Upload, X, Trash2 } from 'lucide-react';
import { PaymentStatus } from '../backend';

export default function CustomerDashboard() {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const { data: totalBalance = 0 } = useGetBalancesSum();
  const { data: totalCollected = 0 } = useGetTotalCollectedPayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const deleteAllCustomers = useDeleteAllCustomers();

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.paymentStatus === statusFilter);
    }

    return filtered;
  }, [customers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const paid = customers.filter((c) => c.paymentStatus === PaymentStatus.paid).length;
    const partiallyPaid = customers.filter((c) => c.paymentStatus === PaymentStatus.partiallyPaid).length;
    const unpaid = customers.filter((c) => c.paymentStatus === PaymentStatus.unpaid).length;

    return { paid, partiallyPaid, unpaid, total: customers.length };
  }, [customers]);

  const handleDeleteAll = async () => {
    try {
      await deleteAllCustomers.mutateAsync();
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('Delete all error in component:', error);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customer Balances</h2>
            <p className="text-muted-foreground">Manage and track outstanding payments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {customers.length > 0 && (
              <Button
                onClick={() => setIsDeleteAllDialogOpen(true)}
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            )}
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} totalBalance={totalBalance} totalCollected={totalCollected} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={PaymentStatus.paid}>Paid</SelectItem>
              <SelectItem value={PaymentStatus.partiallyPaid}>Partially Paid</SelectItem>
              <SelectItem value={PaymentStatus.unpaid}>Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CustomerTable customers={filteredCustomers} isLoading={isLoading} />

      <CustomerFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Customers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all <strong>{customers.length}</strong> customer{customers.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all customer records and payment history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllCustomers.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAllCustomers.isPending}
            >
              {deleteAllCustomers.isPending ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
