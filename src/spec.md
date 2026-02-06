# Specification

## Summary
**Goal:** Update the default WhatsApp reminder message template for the “Send outstanding via WhatsApp” action to include a greeting, the selected customer’s name, and the formatted outstanding balance.

**Planned changes:**
- Change the pre-filled WhatsApp message template to: `नमस्कार (Customer Name) आपली खाते बाकी लवकरात लवकर जमा करून सहकार्य करावे. (Outstanding Balance)`.
- At runtime, replace `(Customer Name)` with the selected customer’s name.
- At runtime, replace `(Outstanding Balance)` with the customer’s outstanding balance formatted as INR (consistent with current formatting behavior).
- Keep the WhatsApp message edit dialog editable, using the user-edited text to generate the WhatsApp deep link.

**User-visible outcome:** When sending outstanding via WhatsApp for a customer with a valid mobile number and an outstanding balance, the message dialog opens pre-filled with the new Marathi template including the customer’s name and INR-formatted outstanding amount, and the user can still edit it before sending.
