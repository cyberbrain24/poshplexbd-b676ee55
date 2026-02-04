import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, useTransactionCategories, Transaction } from "@/hooks/useAccounts";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Transaction | null;
  defaultType?: "income" | "expense" | "transfer";
}

const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultType = "income",
}: TransactionModalProps) => {
  const { data: accounts = [] } = useAccounts();
  const [type, setType] = useState<"income" | "expense">(
    defaultType === "transfer" ? "income" : defaultType
  );
  const { data: categories = [] } = useTransactionCategories(type);

  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    type: defaultType,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      const txType = initialData.type === "transfer" ? "income" : initialData.type;
      setFormData({
        account_id: initialData.account_id,
        category_id: initialData.category_id || "",
        type: txType,
        amount: initialData.amount.toString(),
        date: initialData.date,
        notes: initialData.notes || "",
      });
      setType(txType);
    } else {
      const txType = defaultType === "transfer" ? "income" : defaultType;
      setFormData({
        account_id: "",
        category_id: "",
        type: txType,
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setType(txType);
    }
  }, [initialData, defaultType, isOpen]);

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    setFormData({ ...formData, type: newType, category_id: "" });
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubCategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Transaction" : `Add ${type === "income" ? "Income" : "Expense"}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as "income" | "expense")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account *</Label>
            <Select
              value={formData.account_id}
              onValueChange={(v) => setFormData({ ...formData, account_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(v) => setFormData({ ...formData, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((parent) => (
                  <div key={parent.id}>
                    <SelectItem value={parent.id} className="font-medium">
                      {parent.name}
                    </SelectItem>
                    {getSubCategories(parent.id).map((sub) => (
                      <SelectItem key={sub.id} value={sub.id} className="pl-6">
                        ↳ {sub.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.account_id || !formData.amount}>
              {initialData ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
