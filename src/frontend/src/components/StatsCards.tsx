import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Users, DollarSign, CheckCircle, AlertCircle, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { useResetTotalCollectedPayments } from '../hooks/useQueries';

interface StatsCardsProps {
  stats: {
    total: number;
    paid: number;
    partiallyPaid: number;
    unpaid: number;
  };
  totalBalance: number;
  totalCollected: number;
}

export default function StatsCards({ stats, totalBalance, totalCollected }: StatsCardsProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const resetMutation = useResetTotalCollectedPayments();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleResetCollectedAmount = async () => {
    try {
      await resetMutation.mutateAsync();
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset collected amount:', error);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/10">
                <DollarSign className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Collected</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                  disabled={resetMutation.isPending || totalCollected === 0}
                  className="h-7 px-2 text-xs"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="mt-2 text-3xl font-bold">{stats.paid}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partially Paid</p>
                <p className="mt-2 text-3xl font-bold">{stats.partiallyPaid}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unpaid</p>
                <p className="mt-2 text-3xl font-bold">{stats.unpaid}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Collected Amount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the total collected payments amount to zero? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetCollectedAmount}
              disabled={resetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
