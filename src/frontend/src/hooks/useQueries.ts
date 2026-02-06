import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CustomerRecord, CreateCustomer, PaymentStatus, UserProfile } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      console.error('Profile save error:', error);
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Customer Queries
export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerRecord[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: CreateCustomer) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.createCustomer(customer);
        return result;
      } catch (error: any) {
        console.error('Create customer error:', error);
        // Normalize error message for better UX
        let errorMessage = 'Failed to create customer';
        
        if (error.message) {
          if (error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
            errorMessage = 'You must be logged in to create a customer';
          } else if (error.message.includes('not found')) {
            errorMessage = 'Customer data could not be saved';
          } else {
            errorMessage = error.message;
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['balancesSum'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      console.error('Create customer mutation error:', error);
      // Toast is shown, but error is also thrown for dialog to catch
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, updated }: { name: string; updated: CreateCustomer }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.updateCustomer(name, updated);
        return result;
      } catch (error: any) {
        console.error('Update customer error:', error);
        // Normalize error message for better UX
        let errorMessage = 'Failed to update customer';
        
        if (error.message) {
          if (error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
            errorMessage = 'You must be logged in to update a customer';
          } else if (error.message.includes('not found')) {
            errorMessage = 'Customer not found';
          } else {
            errorMessage = error.message;
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['balancesSum'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      console.error('Update customer mutation error:', error);
      // Toast is shown, but error is also thrown for dialog to catch
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.deleteCustomer(name);
      } catch (error: any) {
        console.error('Delete customer error:', error);
        throw new Error(error.message || 'Failed to delete customer');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['balancesSum'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete customer mutation error:', error);
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
}

export function useDeleteAllCustomers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.deleteAllCustomers();
      } catch (error: any) {
        console.error('Delete all customers error:', error);
        throw new Error(error.message || 'Failed to delete all customers');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['balancesSum'] });
      queryClient.invalidateQueries({ queryKey: ['totalCollectedPayments'] });
      toast.success('All customers deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete all customers mutation error:', error);
      toast.error(`Failed to delete all customers: ${error.message}`);
    },
  });
}

export function useSearchCustomers(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerRecord[]>({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchCustomers(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useFilterByPaymentStatus(status: PaymentStatus | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerRecord[]>({
    queryKey: ['customers', 'filter', status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return actor.filterByPaymentStatus(status);
    },
    enabled: !!actor && !isFetching && status !== null,
  });
}

export function useGetBalancesSum() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['balancesSum'],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getBalancesSum();
    },
    enabled: !!actor && !isFetching,
  });
}

// Payment Collection Queries
export function useRecordPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerName, amount }: { customerName: string; amount: number }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.recordPayment(customerName, amount);
        return result;
      } catch (error: any) {
        console.error('Record payment error:', error);
        throw new Error(error.message || 'Failed to record payment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['balancesSum'] });
      queryClient.invalidateQueries({ queryKey: ['totalCollectedPayments'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Record payment mutation error:', error);
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

export function useGetTotalCollectedPayments() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['totalCollectedPayments'],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTotalCollectedPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResetTotalCollectedPayments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.resetTotalCollectedPayments();
      } catch (error: any) {
        console.error('Reset total collected payments error:', error);
        throw new Error(error.message || 'Failed to reset total collected payments');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['totalCollectedPayments'] });
      toast.success('Total collected payments reset successfully');
    },
    onError: (error: Error) => {
      console.error('Reset total collected payments mutation error:', error);
      toast.error(`Failed to reset total collected payments: ${error.message}`);
    },
  });
}
