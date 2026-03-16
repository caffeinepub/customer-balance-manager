# Specification

## Summary
**Goal:** Update the default “Send outstanding via WhatsApp” reminder message to a Marathi template with four paragraphs (blank-line separated) and dynamic placeholders for customer name and outstanding balance.

**Planned changes:**
- Replace the existing default WhatsApp outstanding-balance message template with the provided Marathi text, rendered as four paragraphs separated by blank lines.
- Ensure runtime insertion of the selected customer’s name as the second paragraph.
- Ensure runtime insertion of the customer’s outstanding balance as the fourth paragraph, formatted in INR using the existing en-IN currency formatting.
- Preserve paragraph breaks when generating the WhatsApp wa.me deep link prefilled text.

**User-visible outcome:** When opening the WhatsApp outstanding reminder flow, the default message appears in Marathi as four blank-line-separated paragraphs (including the customer name and INR-formatted balance), and sending preserves the paragraph breaks in WhatsApp.
