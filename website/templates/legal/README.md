# Owned legal templates (Phase C)

Export your NDA and Activation Retainer from PandaDoc (or Word) and upload them to **SignWell** as templates.

## SignWell setup

1. Create a SignWell account (Light or API plan).
2. Upload PDFs for **Mutual NDA** and **Phase 1 Activation Retainer**.
3. Add placeholder roles named **Owner** (Michael Hart) and **Recipient** (client).
4. *(Optional)* Add **TextField** elements whose **API IDs** match merge tokens (see `lib/documents/merge-fields.ts`), then set `SIGNWELL_PREFILL_TEMPLATE_FIELDS=true` in Vercel. **Default auto-fill** uses source PDFs in this folder instead — no SignWell TextFields required.

5. **Required for auto-fill:** Save your PandaDoc exports here (same files uploaded to SignWell):
   - `nda-mutual.pdf`
   - `retainer-activation.pdf`
   Or set `SIGNWELL_SOURCE_PDF_NDA` / `SIGNWELL_SOURCE_PDF_RETAINER` in Vercel to absolute paths.

   Example API IDs if you add TextFields instead:
   - `Owner.Company`, `Owner.State`, `Recipient.Company`, `Recipient.FirstName`, `Recipient.LastName`, `Date`, etc.
   - Retainer: `RETAINER AMOUNT`, `TOTAL PHASE 1 FEE`
6. Copy template IDs from the SignWell URL into Vercel env vars.

## Vercel environment variables

| Variable | Purpose |
|----------|---------|
| `DOCUMENTS_BACKEND` | Set to `owned` (default when `SIGNWELL_API_KEY` is set) |
| `SIGNWELL_API_KEY` | SignWell API key |
| `SIGNWELL_TEST_MODE` | `true` in preview/dev |
| `SIGNWELL_TEMPLATE_NDA_ID` | NDA template ID |
| `SIGNWELL_TEMPLATE_RETAINER_ID` | Retainer template ID |
| `SIGNWELL_PDF_PREFILL` | `false` to disable server-side PDF merge (default: on) |
| `SIGNWELL_SOURCE_PDF_NDA` | Optional override path to NDA source PDF |
| `SIGNWELL_SOURCE_PDF_RETAINER` | Optional override path to retainer source PDF |
| `MH_PAYMENT_BANK_NAME` | Bank name on remittance PDF |
| `MH_PAYMENT_ROUTING_NUMBER` | ACH/wire routing |
| `MH_PAYMENT_ACCOUNT_NUMBER` | Account number |
| `MH_PAYMENT_ACCOUNT_NAME` | Optional — defaults to legal name |
| `MH_PAYMENT_REMITTANCE_EMAIL` | Optional — where clients confirm payment |

## Payments — ACH / wire / check only

- No Stripe, no PandaDoc Collect, no QuickBooks card links.
- Admin generates a **remittance instruction PDF** and copies a **QuickBooks invoice draft**.
- In QuickBooks: turn **off** online credit card and bank payment for each invoice.
- Mark agreement paid manually in admin when funds arrive.

## PandaDoc fallback

Set `DOCUMENTS_BACKEND=pandadoc` to use the legacy PandaDoc panel without removing SignWell config.
