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
import { Switch } from "@/components/ui/switch";
import {
  CustomerType,
  useCreateCustomerType,
  useUpdateCustomerType,
} from "@/hooks/useCustomers";

const customerTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
  show_on_public_page: z.boolean(),
  show_member_since: z.boolean(),
});

type CustomerTypeFormValues = z.infer<typeof customerTypeSchema>;

interface CustomerTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerType?: CustomerType | null;
}

const CustomerTypeModal = ({ open, onOpenChange, customerType }: CustomerTypeModalProps) => {
  const createCustomerType = useCreateCustomerType();
  const updateCustomerType = useUpdateCustomerType();

  const form = useForm<CustomerTypeFormValues>({
    resolver: zodResolver(customerTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      show_on_public_page: false,
      show_member_since: true,
    },
  });

  useEffect(() => {
    if (customerType) {
      form.reset({
        name: customerType.name,
        description: customerType.description || "",
        is_active: customerType.is_active,
        show_on_public_page: customerType.show_on_public_page ?? false,
        show_member_since: customerType.show_member_since ?? true,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        is_active: true,
        show_on_public_page: false,
        show_member_since: true,
      });
    }
  }, [customerType, form]);

  const onSubmit = async (values: CustomerTypeFormValues) => {
    const data = {
      name: values.name,
      description: values.description || null,
      is_active: values.is_active,
      show_on_public_page: values.show_on_public_page,
      show_member_since: values.show_member_since,
    };

    if (customerType) {
      await updateCustomerType.mutateAsync({ id: customerType.id, ...data });
    } else {
      await createCustomerType.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customerType ? "Edit Customer Type" : "Add Customer Type"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Membership type name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe this membership type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive types won't appear in dropdowns
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_on_public_page"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show on Public Page</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Display this membership type on the public membership page
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_member_since"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show "Member Since"</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Display the membership assignment date publicly
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomerType.isPending || updateCustomerType.isPending}>
                {customerType ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerTypeModal;
