import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PaymentMethod, PaymentMethodFormData, useCreatePaymentMethod, useUpdatePaymentMethod } from "@/hooks/usePaymentMethods";
import { PaymentMethodType } from "@/hooks/useOrders";
import { Plus, Trash2 } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod?: PaymentMethod | null;
}

const PAYMENT_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card Payment" },
  { value: "online_gateway", label: "Online Gateway" },
];

export function PaymentMethodModal({ open, onOpenChange, paymentMethod }: PaymentMethodModalProps) {
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: "",
    type: "cod",
    instructions: "",
    account_details: {},
    is_active: true,
    sort_order: 0,
  });
  const [accountFields, setAccountFields] = useState<{ key: string; value: string }[]>([]);

  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        name: paymentMethod.name,
        type: paymentMethod.type,
        instructions: paymentMethod.instructions || "",
        account_details: paymentMethod.account_details || {},
        is_active: paymentMethod.is_active,
        sort_order: paymentMethod.sort_order,
      });
      // Convert account_details object to array of key-value pairs
      const details = paymentMethod.account_details || {};
      setAccountFields(
        Object.entries(details).map(([key, value]) => ({ key, value: String(value) }))
      );
    } else {
      setFormData({
        name: "",
        type: "cod",
        instructions: "",
        account_details: {},
        is_active: true,
        sort_order: 0,
      });
      setAccountFields([]);
    }
  }, [paymentMethod, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert account fields array back to object
    const account_details: Record<string, string> = {};
    accountFields.forEach(({ key, value }) => {
      if (key.trim()) {
        account_details[key.trim()] = value;
      }
    });

    const dataToSubmit = {
      ...formData,
      account_details,
    };

    if (paymentMethod) {
      await updateMutation.mutateAsync({ id: paymentMethod.id, data: dataToSubmit });
    } else {
      await createMutation.mutateAsync(dataToSubmit);
    }
    onOpenChange(false);
  };

  const addAccountField = () => {
    setAccountFields([...accountFields, { key: "", value: "" }]);
  };

  const removeAccountField = (index: number) => {
    setAccountFields(accountFields.filter((_, i) => i !== index));
  };

  const updateAccountField = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...accountFields];
    updated[index][field] = newValue;
    setAccountFields(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {paymentMethod ? "Edit Payment Method" : "Add Payment Method"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., bKash"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PaymentMethodType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Payment Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Instructions shown to customers during checkout..."
              rows={3}
            />
          </div>

          {/* Dynamic Account Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Account Details</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAccountField}>
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add custom fields like Account Number, Account Name, etc.
            </p>
            
            <div className="space-y-2">
              {accountFields.map((field, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Field name (e.g., Account Number)"
                    value={field.key}
                    onChange={(e) => updateAccountField(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateAccountField(index, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAccountField(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : paymentMethod ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
