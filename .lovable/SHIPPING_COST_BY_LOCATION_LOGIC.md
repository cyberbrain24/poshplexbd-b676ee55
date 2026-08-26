# Location-Based Shipping Cost Logic

Use this logic in any project. It classifies a delivery address into a zone, then returns the correct shipping fee.

---

## 1. Database schema (minimum)

```sql
CREATE TABLE divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE thanas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  division_id uuid REFERENCES divisions(id),
  shipping_cost numeric NOT NULL DEFAULT 120,
  is_active boolean NOT NULL DEFAULT true
);
```

> Store the real fee on each `thana` row. Name matching should only be a fallback.

---

## 2. Zone classification logic

```ts
function getDeliveryZone(divisionName: string, thanaName?: string): "inside" | "suburban" | "outside" {
  const div = (divisionName || "").trim().toLowerCase();
  const tha = (thanaName || "").trim().toLowerCase();

  // Dhaka City = inside Dhaka
  if (div === "dhaka city" || div === "dhaka") {
    return "inside";
  }

  // Dhaka Sub-urban = suburban
  if (div.includes("sub-urban") || div.includes("suburban") || tha.includes("sub-urban") || tha.includes("suburban")) {
    return "suburban";
  }

  // Everything else = outside Dhaka
  return "outside";
}
```

---

## 3. Shipping cost lookup

### Option A: Fee stored per thana (recommended)

```ts
async function getShippingCost(thanaId: string): Promise<number> {
  const { data } = await db
    .from("thanas")
    .select("shipping_cost")
    .eq("id", thanaId)
    .eq("is_active", true)
    .single();

  return data?.shipping_cost ?? 120; // default fallback
}
```

### Option B: Zone-based flat fee

```ts
function getShippingCostByZone(zone: "inside" | "suburban" | "outside"): number {
  switch (zone) {
    case "inside":   return 60;
    case "suburban": return 80;
    case "outside":  return 120;
    default:         return 120;
  }
}
```

---

## 4. Full checkout flow

```ts
async function calculateShipping(divisionName: string, thanaId: string, thanaName: string) {
  const zone = getDeliveryZone(divisionName, thanaName);

  // Prefer database value per thana
  const cost = await getShippingCost(thanaId);

  // If no database value exists, fall back to zone flat fee
  const finalCost = cost || getShippingCostByZone(zone);

  return {
    zone,
    cost: finalCost,
    label: zone === "inside"
      ? "Inside Dhaka"
      : zone === "suburban"
        ? "Sub-urban Dhaka"
        : "Outside Dhaka"
  };
}
```

---

## 5. Important rules

1. **Never trust the division name alone** — always try to read `shipping_cost` from the selected `thana` row first.
2. **Snapshot the fee onto the order** when the order is created. Later price changes must not affect old orders.
3. **Default to the highest fee** (e.g., ৳120) when nothing is selected, never the cheapest.
4. **Only show active (`is_active = true`) thanas** in the checkout dropdown.
5. **Save both `shipping_division_id` and `shipping_thana_id`** on the order, not just text names.

---

## 6. Example mapping

| Division | Thana | Zone | Default Fee |
|---|---|---|---|
| Dhaka City | Mirpur | inside | ৳60 |
| Dhaka Sub-urban | Savar | suburban | ৳80 |
| Chattogram | Agrabad | outside | ৳120 |
| Rajshahi | Boalia | outside | ৳120 |

---

## 7. One-line summary

> Read the shipping fee from the selected area/thana row first; only fall back to name-based zone matching when no database value exists.
