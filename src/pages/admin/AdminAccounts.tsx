import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, TrendingUp, TrendingDown, Wallet, Edit, Trash2, ArrowLeftRight } from "lucide-react";
import {
  useAccounts,
  useTransactions,
  useTransactionCategories,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  Transaction,
  TransactionFilters,
} from "@/hooks/useAccounts";
import TransactionModal from "@/components/admin/TransactionModal";
import TransferModal from "@/components/admin/TransferModal";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

const AdminAccounts = () => {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: categories = [] } = useTransactionCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleAddIncome = () => {
    setModalType("income");
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleAddExpense = () => {
    setModalType("expense");
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (transaction.type === "transfer") {
      setIsTransferModalOpen(true);
    } else {
      setModalType(transaction.type);
      setIsModalOpen(true);
    }
  };

  const handleSubmit = (data: any) => {
    if (editingTransaction) {
      updateTransaction.mutate({ id: editingTransaction.id, ...data });
    } else {
      createTransaction.mutate(data);
    }
    setIsModalOpen(false);
    setIsTransferModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction.mutate(deleteId);
      setDeleteId(null);
    }
  };

  // Using centralized BDT currency formatter from @/lib/currency

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts Dashboard</h1>
          <p className="text-muted-foreground">Manage income, expenses, and track balances</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddIncome} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={handleAddExpense} variant="destructive">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button 
            onClick={() => {
              setEditingTransaction(null);
              setIsTransferModalOpen(true);
            }} 
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Filtered period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">Filtered period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Account Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 border rounded-lg">
                <p className="text-sm font-medium">{account.name}</p>
                <p className={`text-xl font-bold ${Number(account.current_balance) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {formatCurrency(Number(account.current_balance))}
                </p>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="text-muted-foreground col-span-full">No accounts yet. Add accounts in Accounts List.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select
              value={filters.accountId || "all"}
              onValueChange={(v) => setFilters({ ...filters, accountId: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.type || "all"}
              onValueChange={(v) => setFilters({ ...filters, type: v === "all" ? undefined : (v as "income" | "expense" | "transfer") })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.categoryId || "all"}
              onValueChange={(v) => setFilters({ ...filters, categoryId: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate || ""}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate || ""}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category / Details</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      {transaction.type === "transfer" 
                        ? `${transaction.account?.name || "-"} → ${transaction.to_account?.name || "-"}`
                        : transaction.account?.name || "-"
                      }
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            : transaction.type === "expense"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.type === "transfer" 
                        ? "Balance Transfer" 
                        : transaction.category?.name || "-"
                      }
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{transaction.notes || "-"}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.type === "income" 
                          ? "text-emerald-600" 
                          : transaction.type === "expense" 
                          ? "text-destructive" 
                          : "text-primary"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                      {formatCurrency(Number(transaction.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingTransaction}
        defaultType={modalType}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingTransaction}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This will update the account balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAccounts;
