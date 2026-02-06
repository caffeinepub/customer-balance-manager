import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomerRecord {
    paymentStatus: PaymentStatus;
    name: string;
    mobileNumber: string;
    outstandingBalance: number;
}
export interface CreateCustomer {
    paymentStatus: PaymentStatus;
    balance: number;
    name: string;
    mobileNumber: string;
}
export interface UserProfile {
    name: string;
}
export enum PaymentStatus {
    paid = "paid",
    unpaid = "unpaid",
    partiallyPaid = "partiallyPaid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomer(customer: CreateCustomer): Promise<CustomerRecord>;
    deleteAllCustomers(): Promise<void>;
    deleteCustomer(name: string): Promise<void>;
    filterByPaymentStatus(status: PaymentStatus): Promise<Array<CustomerRecord>>;
    getAllCustomers(): Promise<Array<CustomerRecord>>;
    getBalancesSum(): Promise<number>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(name: string): Promise<CustomerRecord>;
    getTotalCollectedPayments(): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordPayment(customerName: string, amount: number): Promise<CustomerRecord>;
    resetTotalCollectedPayments(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCustomers(searchTerm: string): Promise<Array<CustomerRecord>>;
    updateCustomer(name: string, updated: CreateCustomer): Promise<CustomerRecord>;
}
