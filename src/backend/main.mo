import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  // Types
  type PaymentStatus = { #paid; #partiallyPaid; #unpaid };
  type CustomerRecord = {
    name : Text;
    mobileNumber : Text;
    outstandingBalance : Float;
    paymentStatus : PaymentStatus;
  };
  type PaymentRecord = {
    customerName : Text;
    amount : Float;
    timestamp : Int;
  };
  type CreateCustomer = {
    name : Text;
    mobileNumber : Text;
    balance : Float;
    paymentStatus : PaymentStatus;
  };
  public type UserProfile = { name : Text };

  // Module for CustomerRecord comparison by name
  module CustomerRecord {
    public func compare(customer1 : CustomerRecord, customer2 : CustomerRecord) : Order.Order {
      Text.compare(customer1.name, customer2.name);
    };
  };

  // Access Control System (authorization directly allows users to use createCustomer)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Customer and User Profile storage
  let customers = Map.empty<Text, CustomerRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let paymentRecords = Map.empty<Text, PaymentRecord>();
  var totalCollectedPayments = 0.0;

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    assertAuthenticated(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    assertAuthenticated(caller);
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    assertAuthenticated(caller);
    userProfiles.add(caller, profile);
  };

  // CRUD Operations
  public shared ({ caller }) func createCustomer(customer : CreateCustomer) : async CustomerRecord {
    assertAuthenticated(caller);
    let newCustomer = {
      name = customer.name;
      mobileNumber = customer.mobileNumber;
      outstandingBalance = customer.balance;
      paymentStatus = customer.paymentStatus;
    };
    customers.add(customer.name, newCustomer);
    newCustomer;
  };

  public query ({ caller }) func getCustomer(name : Text) : async CustomerRecord {
    assertAuthenticated(caller);

    switch (customers.get(name)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public shared ({ caller }) func updateCustomer(name : Text, updated : CreateCustomer) : async CustomerRecord {
    assertAuthenticated(caller);

    switch (customers.get(name)) {
      case (null) { Runtime.trap("Customer not found") };
      case (_) {
        let newCustomer = {
          name = updated.name;
          mobileNumber = updated.mobileNumber;
          outstandingBalance = updated.balance;
          paymentStatus = updated.paymentStatus;
        };
        customers.add(name, newCustomer);
        newCustomer;
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(name : Text) : async () {
    assertAuthenticated(caller);

    if (not customers.containsKey(name)) {
      Runtime.trap("Customer not found");
    };
    customers.remove(name);
  };

  public shared ({ caller }) func deleteAllCustomers() : async () {
    assertAuthenticated(caller);
    customers.clear();
  };

  public query ({ caller }) func getAllCustomers() : async [CustomerRecord] {
    assertAuthenticated(caller);

    customers.values().toArray();
  };

  // Search and Filter
  public query ({ caller }) func searchCustomers(searchTerm : Text) : async [CustomerRecord] {
    assertAuthenticated(caller);

    customers.values().filter(
      func(c) {
        c.name.contains(#text searchTerm) or c.mobileNumber.contains(#text searchTerm);
      }
    ).toArray();
  };

  public query ({ caller }) func filterByPaymentStatus(status : PaymentStatus) : async [CustomerRecord] {
    assertAuthenticated(caller);

    customers.values().filter(
      func(c) { c.paymentStatus == status }
    ).toArray();
  };

  // Balances Sum Calculation
  public query ({ caller }) func getBalancesSum() : async Float {
    assertAuthenticated(caller);

    customers.values().foldLeft(
      0.0,
      func(acc, customer) {
        acc + customer.outstandingBalance;
      },
    );
  };

  // Payment Collection
  public shared ({ caller }) func recordPayment(customerName : Text, amount : Float) : async CustomerRecord {
    assertAuthenticated(caller);

    let customer = switch (customers.get(customerName)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    let newBalance = customer.outstandingBalance - amount;
    let newStatus : PaymentStatus = if (newBalance <= 0.0) {
      #paid;
    } else if (newBalance < customer.outstandingBalance) {
      #partiallyPaid;
    } else {
      #unpaid;
    };

    let newCustomer = {
      customer with outstandingBalance = if (newBalance < 0.0) { 0.0 } else { newBalance };
      paymentStatus = newStatus;
    };

    customers.add(customerName, newCustomer);

    let paymentRecord = {
      customerName;
      amount;
      timestamp = 0; // Timestamps can be added if needed in the future
    };

    paymentRecords.add(customerName, paymentRecord);
    totalCollectedPayments += amount;

    newCustomer;
  };

  public query ({ caller }) func getTotalCollectedPayments() : async Float {
    assertAuthenticated(caller);
    totalCollectedPayments;
  };

  // Reset Total Collected Payments Functionality
  public shared ({ caller }) func resetTotalCollectedPayments() : async () {
    assertAuthenticated(caller);
    totalCollectedPayments := 0.0;
  };

  func assertAuthenticated(caller : Principal.Principal) {
    let role = AccessControl.getUserRole(accessControlState, caller);
    if (role == #guest) {
      Runtime.trap("Unauthorized: Authentication required");
    };
  };
};
