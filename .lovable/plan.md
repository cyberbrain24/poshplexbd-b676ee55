
# Manual Payment Recording for Orders

## Overview

You need the ability to record manual payments (full or partial) for orders directly from the admin panel. Currently, the system only supports:
1. COD approval after Steadfast delivery (auto-collects amount from courier)
2. Basic payment status updates (without amount tracking)

This plan adds a complete **Manual Payment Recording** feature that tracks payment amounts, creates income transactions, and updates payment status automatically.

---

## What You'll Get

1. **"Record Payment" Button** in Order Detail Modal
2. **Payment Recording Modal** with:
   - Amount input (defaulting to remaining balance)
   - Account selection (where to credit the payment)
   - Payment reference/note field
3. **Automatic Payment Status Updates**:
   - Full payment → Status changes to "Paid"
   - Partial payment → Status changes to "Partially Paid"
4. **Payment History** visible in the order timeline
5. **Income Transaction** automatically created in the accounts system
6. **Running Balance** showing paid vs. remaining amount

---

## User Flow

```text
1. Open Order Detail Modal
2. See "Payment Summary" showing:
   - Total Amount: ৳5,000
   - Paid Amount: ৳2,000
   - Remaining: ৳3,000
3. Click "Record Payment"
4. Enter amount (e.g., ৳3,000)
5. Select account to credit
6. Add optional reference note
7. Click "Confirm Payment"
8. System updates payment status & creates income record
```

---

## Technical Implementation

### 1. Database Changes

**New Table: `order_payments`**
This table tracks individual payment entries for each order:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Links to orders table |
| amount | DECIMAL | Payment amount |
| account_id | UUID | Account credited |
| transaction_id | UUID | Links to transactions table |
| payment_reference | TEXT | Optional reference/note |
| recorded_by | UUID | Admin who recorded |
| recorded_at | TIMESTAMP | When payment was recorded |
| created_at | TIMESTAMP | Record creation time |

**Update `orders` Table:**
- Add `paid_amount` column (DECIMAL) - tracks total amount paid so far

### 2. New Hook: `useRecordPayment`

Creates a mutation that:
1. Validates payment amount (cannot exceed remaining balance)
2. Inserts record into `order_payments`
3. Updates `orders.paid_amount` by adding the new amount
4. Creates income transaction in `transactions` table
5. Updates `orders.payment_status`:
   - If `paid_amount >= total_amount` → "paid"
   - If `paid_amount > 0` but `< total_amount` → "partially_paid"
6. Adds entry to `order_status_history`
7. Invalidates relevant queries

### 3. UI Components

**A. Payment Summary Section** (in OrderDetailModal)
```
┌─────────────────────────────────────┐
│ Payment Summary                      │
├─────────────────────────────────────┤
│ Total:     ৳5,000                   │
│ Paid:      ৳2,000                   │
│ Remaining: ৳3,000                   │
│                                     │
│ [Record Payment]                    │
└─────────────────────────────────────┘
```

**B. New `PaymentRecordModal` Component**
- Amount input with validation
- Account dropdown (from accounts table)
- Payment reference text field
- Confirm/Cancel buttons

**C. Payment History in Timeline**
Shows each payment record with amount, date, and account

### 4. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/...` | Create `order_payments` table, add `paid_amount` to orders |
| `src/hooks/useOrderPayments.ts` | New - payment recording & fetching hooks |
| `src/components/admin/PaymentRecordModal.tsx` | New - payment entry modal |
| `src/components/admin/OrderDetailModal.tsx` | Add payment summary section & record button |
| `src/hooks/useOrders.ts` | Update Order interface to include paid_amount |

---

## Validation Rules

1. Payment amount must be greater than 0
2. Payment amount cannot exceed remaining balance
3. Account selection is required
4. Order must not be cancelled or refunded

---

## Benefits

- Track exactly how much has been paid on each order
- Support split/installment payments
- Automatic income recording in accounts
- Complete payment audit trail
- Works for all payment methods (not just COD)
