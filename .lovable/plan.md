## Changes

### 1. `src/pages/admin/AdminAddOrder.tsx` — remove Gender & Date of Birth
- Delete the Gender `<Select>` and Date of Birth `<Input>` fields from the customer form (around lines 406–430).
- Remove `gender` and `birthdate` from the `customer` state shape and initial values.
- Remove the RPC arg `p_gender` and the follow-up `.update({ gender, birthdate })` block that persists them (lines ~272, ~282–297). Existing customers keep whatever gender/birthdate they already have in the DB.
- Keep autofill logic for name/phone/email/address/division/thana untouched.

### 2. `src/pages/admin/AdminOrders.tsx` — rename source badge
- In the badge block (lines 801–812), change the label `'Admin Order'` to `'Manual Order'`. `'Web Order'` stays for storefront orders (`created_by_source !== 'admin'`).

### 3. Order notes on the grid — already working
- `order.customer_notes` is already rendered on each row (lines 815–822) and `AdminAddOrder` already passes `customerNotes` into the order via `useCheckout`. No change needed; notes entered on `/admin/add-order` will show up on the `/admin/orders` grid automatically.

## Out of scope
- No DB/schema changes. `customers.gender` and `customers.birthdate` columns stay (used elsewhere in customer management).
- No changes to `created_by_source` logic — storefront orders continue to be tagged as web, admin-created ones as manual.
