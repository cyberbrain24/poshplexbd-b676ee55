import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useAccounts } from "@/hooks/useAccounts";
import { useRecordPayment } from "@/hooks/useOrderPayments";
import { Loader2, CreditCard } from "lucide-react";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";

interface PaymentRecordModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  paidAmount: number;
}

const PaymentRecordModal = ({
  open,
  onClose,
  orderId,
  totalAmount,
  paidAmount,
}: PaymentRecordModalProps) => {
  const remainingBalance = totalAmount - paidAmount;
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const recordPayment = useRecordPayment();

  const [amount, setAmount] = useState<string>(remainingBalance.toString());
  const [accountId, setAccountId] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount(remainingBalance.toString());
      setAccountId("");
      setPaymentReference("");
    }
  }, [open, remainingBalance]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    if (!accountId) {
      return;
    }

    recordPayment.mutate(
      {
        orderId,
        amount: numAmount,
        accountId,
        paymentReference: paymentReference || undefined,
        totalAmount,
        currentPaidAmount: paidAmount,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount > 0 && numAmount <= remainingBalance;
  const canSubmit = isValidAmount && accountId && !recordPayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Summary */}
          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-bold">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{CURRENCY_SYMBOL}</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="Enter amount"
                min={1}
                max={remainingBalance}
              />
            </div>
            {numAmount > remainingBalance && (
              <p className="text-sm text-destructive">
                Amount cannot exceed remaining balance
              </p>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Credit to Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={accountsLoading ? "Loading..." : "Select account"} />
              </SelectTrigger>
              <SelectContent>
                {accounts?.filter(a => a.is_active).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.current_balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference (Optional)</Label>
            <Textarea
              id="reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g., Transaction ID, Bank reference, Notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {recordPayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Recording...
              </>
            ) : (
              <>Confirm Payment</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRecordModal;
