import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  PromoUsage,
  useCreatePromoUsage,
  useUpdatePromoUsage,
} from "@/hooks/useCustomers";
import { format } from "date-fns";

const promoUsageSchema = z.object({
  promo_code: z.string().min(1, "Promo code is required"),
  benefit_type: z.string().optional(),
  benefit_amount: z.string().optional(),
  used_at: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type PromoUsageFormValues = z.infer<typeof promoUsageSchema>;

interface PromoUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  promoUsage?: PromoUsage | null;
}

const PromoUsageModal = ({ open, onOpenChange, customerId, promoUsage }: PromoUsageModalProps) => {
  const createPromoUsage = useCreatePromoUsage();
  const updatePromoUsage = useUpdatePromoUsage();

  const form = useForm<PromoUsageFormValues>({
    resolver: zodResolver(promoUsageSchema),
    defaultValues: {
      promo_code: "",
      benefit_type: "",
      benefit_amount: "",
      used_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: "",
    },
  });

  useEffect(() => {
    if (promoUsage) {
      form.reset({
        promo_code: promoUsage.promo_code,
        benefit_type: promoUsage.benefit_type || "",
        benefit_amount: promoUsage.benefit_amount?.toString() || "",
        used_at: format(new Date(promoUsage.used_at), "yyyy-MM-dd'T'HH:mm"),
        notes: promoUsage.notes || "",
      });
    } else {
      form.reset({
        promo_code: "",
        benefit_type: "",
        benefit_amount: "",
        used_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: "",
      });
    }
  }, [promoUsage, form]);

  const onSubmit = async (values: PromoUsageFormValues) => {
    const data = {
      customer_id: customerId,
      promo_code: values.promo_code,
      benefit_type: values.benefit_type || null,
      benefit_amount: values.benefit_amount ? parseFloat(values.benefit_amount) : null,
      used_at: new Date(values.used_at).toISOString(),
      notes: values.notes || null,
    };

    if (promoUsage) {
      await updatePromoUsage.mutateAsync({ id: promoUsage.id, ...data });
    } else {
      await createPromoUsage.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{promoUsage ? "Edit Promo Usage" : "Add Promo Usage"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="promo_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter promo code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="benefit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefit Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Discount, Free item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefit Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="used_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Used *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPromoUsage.isPending || updatePromoUsage.isPending}>
                {promoUsage ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PromoUsageModal;
