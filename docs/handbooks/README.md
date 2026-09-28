# Previax role handbooks

Written guides for each account role. Every handbook has two lenses:

| Section | Meaning |
|---------|---------|
| **Works today** | What the product actually does in code right now |
| **How it should work** | Target product behavior (not yet fully built) |

Use these to onboard teammates, QA a role, or plan the next feature pass. They are **not** in-app help pages.

**Start here for the big picture:** [How roles connect](./connections.md) (diagrams for accounts, pipeline, and what shoppers see).

## Roles

| Handbook | Who | Creates account how |
|----------|-----|---------------------|
| [Connections](./connections.md) | All roles | How they relate (diagrams) |
| [Buyer](./buyer.md) | Home shoppers | Public `/signup` → active immediately |
| [Builder](./builder.md) | Home builders / partners | Public `/signup` → `pending` until admin approves; or marketing `/partner` (no account) |
| [Lender](./lender.md) | Financing partners | Public `/signup` → `pending` until admin approves |
| [Sales](./sales.md) | Internal listing agents | Admin invite only |
| [Admin](./admin.md) | Previax operators | Manual SQL upgrade only (never via public signup) |

## Account creation matrix

| Role | `/signup` | Auto-active? | Dashboard? | Post-auth path |
|------|-----------|--------------|------------|----------------|
| Buyer | Yes | Yes | No | `/browse` |
| Builder | Yes | No (`pending`) | Yes (when active) | `/pending-approval` → `/dashboard` |
| Lender | Yes | No (`pending`) | Yes (when active) | `/pending-approval` → `/dashboard` |
| Sales | No | Set by invite | Yes | Invite → `/set-password` → `/dashboard` |
| Admin | No (blocked) | Manual | Yes | `/dashboard` |

Statuses: `active` | `pending` | `rejected` (`src/lib/types.ts`).

## How to read a handbook

1. Skim **Overview** and **How you get this account**.
2. Walk **Works today** against a real environment.
3. Treat **How it should work** as product intent.
4. Use **Gaps summary** when prioritizing work.
5. Use **Key code** when changing behavior.

## Related

- App README: [../../README.md](../../README.md)
- Original product prompt (archive): [../../PROMPT-FABLE5-DASHBOARD.md](../../PROMPT-FABLE5-DASHBOARD.md)
