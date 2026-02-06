/**
 * Utility functions for WhatsApp integration
 */

/**
 * Normalizes a phone number for WhatsApp links
 * Removes spaces, dashes, and other formatting characters
 * @param phoneNumber - The phone number to normalize
 * @returns Normalized phone number or empty string if invalid
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Basic validation: should have at least 10 digits
  const digitsOnly = cleaned.replace(/\+/g, '');
  if (digitsOnly.length < 10) return '';
  
  return cleaned;
}

/**
 * Formats the outstanding balance message for WhatsApp
 * @param customerName - Name of the customer
 * @param outstandingBalance - Outstanding balance amount
 * @returns Formatted message text
 */
export function formatOutstandingMessage(customerName: string, outstandingBalance: number): string {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(outstandingBalance);
  
  return `नमस्कार ${customerName} आपली खाते बाकी लवकरात लवकर जमा करून सहकार्य करावे. ${formattedAmount}`;
}

/**
 * Generates a WhatsApp deep link with prefilled message
 * @param phoneNumber - The recipient's phone number
 * @param message - The message to prefill
 * @returns WhatsApp URL
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  
  // Use wa.me format which works across all platforms
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * Validates if a customer can receive WhatsApp messages
 * @param mobileNumber - Customer's mobile number
 * @param outstandingBalance - Customer's outstanding balance
 * @returns Object with isValid flag and error message if invalid
 */
export function validateWhatsAppEligibility(
  mobileNumber: string,
  outstandingBalance: number
): { isValid: boolean; error?: string } {
  if (!mobileNumber || mobileNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Mobile number is required to send WhatsApp message',
    };
  }
  
  const normalized = normalizePhoneNumber(mobileNumber);
  if (!normalized) {
    return {
      isValid: false,
      error: 'Invalid mobile number format',
    };
  }
  
  if (outstandingBalance <= 0) {
    return {
      isValid: false,
      error: 'No outstanding balance to send',
    };
  }
  
  return { isValid: true };
}
