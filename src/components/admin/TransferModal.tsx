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
import { useAccounts, Transaction } from "@/hooks/useAccounts";
import { ArrowRight } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Transaction | null;
}

const TransferModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: TransferModalProps) => {
  const { data: accounts = [] } = useAccounts();

  const [formData, setFormData] = useState({
    account_id: "",
    to_account_id: "",
    type: "transfer" as const,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (initialData && initialData.type === "transfer") {
      setFormData({
        account_id: initialData.account_id,
        to_account_id: initialData.to_account_id || "",
        type: "transfer",
        amount: initialData.amount.toString(),
        date: initialData.date,
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        account_id: "",
        to_account_id: "",
        type: "transfer",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: null,
    });
  };

  const isValidForm = 
    formData.account_id && 
    formData.to_account_id && 
    formData.account_id !== formData.to_account_id && 
    formData.amount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Transfer" : "Balance Transfer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <Label>From Account *</Label>
              <Select
                value={formData.account_id}
                onValueChange={(v) => setFormData({ ...formData, account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === formData.to_account_id}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />
            
            <div className="flex-1 space-y-2">
              <Label>To Account *</Label>
              <Select
                value={formData.to_account_id}
                onValueChange={(v) => setFormData({ ...formData, to_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === formData.account_id}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.account_id === formData.to_account_id && formData.account_id && (
            <p className="text-sm text-destructive">
              Source and destination accounts must be different.
            </p>
          )}

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
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
            <Button type="submit" disabled={!isValidForm}>
              {initialData ? "Update" : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
