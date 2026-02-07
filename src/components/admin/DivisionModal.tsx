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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Division,
  useCreateDivision,
  useUpdateDivision,
} from "@/hooks/useCustomers";

const divisionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_active: z.boolean(),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

interface DivisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division | null;
}

const DivisionModal = ({ open, onOpenChange, division }: DivisionModalProps) => {
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();

  const form = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      name: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (division) {
      form.reset({
        name: division.name,
        is_active: division.is_active,
      });
    } else {
      form.reset({
        name: "",
        is_active: true,
      });
    }
  }, [division, form]);

  const onSubmit = async (values: DivisionFormValues) => {
    const data = {
      name: values.name,
      is_active: values.is_active,
    };
    if (division) {
      await updateDivision.mutateAsync({ id: division.id, ...data });
    } else {
      await createDivision.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{division ? "Edit District" : "Add District"}</DialogTitle>
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
                    <Input placeholder="District name" {...field} />
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
                      Inactive divisions won't appear in dropdowns
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
              <Button type="submit" disabled={createDivision.isPending || updateDivision.isPending}>
                {division ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DivisionModal;
