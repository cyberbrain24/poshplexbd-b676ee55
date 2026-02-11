import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
 import { ExternalLink, CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
import {
  Customer,
  useCreateCustomer,
  useUpdateCustomer,
  useDivisions,
  useThanas,
  useCustomerTypes,
} from "@/hooks/useCustomers";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  division_id: z.string().optional(),
  thana_id: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  customer_type_id: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
  birthdate: z.date().optional(),
  public_profile_visible: z.boolean(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

const CustomerModal = ({ open, onOpenChange, customer }: CustomerModalProps) => {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | undefined>();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { data: divisions } = useDivisions();
  const { data: thanas } = useThanas(selectedDivisionId);
  const { data: customerTypes } = useCustomerTypes();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      division_id: "",
      thana_id: "",
      address: "",
      gender: undefined,
      customer_type_id: "",
      notes: "",
      is_active: true,
      birthdate: undefined,
      public_profile_visible: false,
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        division_id: customer.division_id || "",
        thana_id: customer.thana_id || "",
        address: customer.address || "",
        gender: customer.gender,
        customer_type_id: customer.customer_type_id || "",
        notes: customer.notes || "",
        is_active: customer.is_active,
        birthdate: customer.birthdate ? new Date(customer.birthdate) : undefined,
        public_profile_visible: customer.public_profile_visible ?? false,
      });
      setSelectedDivisionId(customer.division_id || undefined);
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        division_id: "",
        thana_id: "",
        address: "",
        gender: undefined,
        customer_type_id: "",
        notes: "",
        is_active: true,
        birthdate: undefined,
        public_profile_visible: false,
      });
      setSelectedDivisionId(undefined);
    }
  }, [customer, form]);

  const onSubmit = async (values: CustomerFormValues) => {
    const customerData: Record<string, unknown> = {
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      division_id: values.division_id || null,
      thana_id: values.thana_id || null,
      address: values.address || null,
      gender: values.gender as 'male' | 'female' | 'other',
      customer_type_id: values.customer_type_id || null,
      notes: values.notes || null,
      is_active: values.is_active,
      birthdate: values.birthdate ? format(values.birthdate, "yyyy-MM-dd") : null,
      public_profile_visible: values.public_profile_visible,
    };

    // Track membership assignment date when membership type changes
    if (customer && values.customer_type_id && values.customer_type_id !== customer.customer_type_id) {
      customerData.membership_assigned_at = new Date().toISOString();
    } else if (!customer && values.customer_type_id) {
      customerData.membership_assigned_at = new Date().toISOString();
    }

    if (customer) {
      await updateCustomer.mutateAsync({ id: customer.id, ...customerData } as any);
    } else {
      await createCustomer.mutateAsync(customerData as any);
    }
    onOpenChange(false);
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivisionId(divisionId || undefined);
    form.setValue("division_id", divisionId);
    form.setValue("thana_id", ""); // Reset thana when division changes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="division_id"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    District
                    <Link
                      to="/admin/divisions"
                      target="_blank"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Manage
                    </Link>
                  </FormLabel>
                    <Select onValueChange={handleDivisionChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisions?.filter(d => d.is_active).map((division) => (
                          <SelectItem key={division.id} value={division.id}>
                            {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thana_id"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Thana
                    <Link
                      to="/admin/thanas"
                      target="_blank"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Manage
                    </Link>
                  </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedDivisionId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDivisionId ? "Select thana" : "Select district first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {thanas?.filter(t => t.is_active).map((thana) => (
                          <SelectItem key={thana.id} value={thana.id}>
                            {thana.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customerTypes?.filter(ct => ct.is_active).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
               control={form.control}
               name="birthdate"
               render={({ field }) => (
                 <FormItem className="flex flex-col">
                   <FormLabel>Birthdate</FormLabel>
                   <Popover>
                     <PopoverTrigger asChild>
                       <FormControl>
                         <Button
                           variant="outline"
                           className={cn(
                             "w-full pl-3 text-left font-normal",
                             !field.value && "text-muted-foreground"
                           )}
                         >
                           {field.value ? (
                             format(field.value, "PPP")
                           ) : (
                             <span>Pick a date</span>
                           )}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                         </Button>
                       </FormControl>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={field.value}
                         onSelect={field.onChange}
                         disabled={(date) =>
                           date > new Date() || date < new Date("1900-01-01")
                         }
                         initialFocus
                         className="pointer-events-auto"
                       />
                     </PopoverContent>
                   </Popover>
                   <FormMessage />
                 </FormItem>
               )}
             />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address" {...field} />
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

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive customers won't appear in main lists
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
              name="public_profile_visible"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Profile</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Show this customer on the public membership page
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
              <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
                {customer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerModal;
