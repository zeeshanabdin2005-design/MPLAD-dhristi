# Corrections applied

1. `src/lib/utils.ts`
   - `formatCurrency()` now treats financial values from the MPLADS dataset as lakh units and converts them to INR before display (`amount * 100000`).

2. `src/services/evidenceService.ts`
   - `logAudit()` no longer writes `caseId: undefined` to Firestore.
   - Optional `metadata` is also omitted when undefined.
   - This prevents Firestore `Unsupported field value: undefined` errors.

## Before running
- Create/configure your local `.env` from `.env.example` with your own credentials.
- Do not commit `.env` or expose service-role/API secrets.
- Run `npm install`, then `npm run dev`.
