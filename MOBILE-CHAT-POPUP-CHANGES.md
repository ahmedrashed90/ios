# MZJ CRM v18 - Mobile navigation and chat customer popup

- Mobile page navigation is hidden by default and opens/closes from one menu button in the top bar.
- Clicking a page closes the mobile navigation automatically.
- The customer name inside the chat header opens the customer data editor as a separate popup.
- The popup allows editing and saving the existing customer fields with the existing save logic.
- Customer ID fallback was expanded so saving works when the document uses `docId`, `documentId`, `__firestoreId`, `leadId`, or `customerId` instead of only `id`.
- Customer status can be changed quickly from a dropdown inside the chat header.
- Existing dashboard department cards and collapsible status sections remain unchanged.
