# PocketGPT Web v6.2 — legal subscription documents

## Updated
- `/terms`: full user agreement and monthly subscription terms in RU/EN/KZ.
- `/refund-policy`: cancellation and refund policy in RU/EN/KZ.
- Billing consent text now explicitly describes monthly automatic renewal and access after cancellation.
- Legal document versions are centralized in `src/lib/legal.ts`.

## Vercel variables required before Live launch

```text
NEXT_PUBLIC_LEGAL_OPERATOR_NAME=<legal name of IP/LLP/operator>
NEXT_PUBLIC_LEGAL_OPERATOR_ID=<BIN/IIN or registration details>
NEXT_PUBLIC_LEGAL_OPERATOR_ADDRESS=<legal/business address>
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=<support/claims email>
```

Do not leave the public operator details incomplete before accepting Live payments.
