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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Thana,
  useCreateThana,
  useUpdateThana,
  useDivisions,
} from "@/hooks/useCustomers";

const thanaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  division_id: z.string().min(1, "Division is required"),
  is_active: z.boolean(),
});

type ThanaFormValues = z.infer<typeof thanaSchema>;

interface ThanaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thana?: Thana | null;
}

const ThanaModal = ({ open, onOpenChange, thana }: ThanaModalProps) => {
  const createThana = useCreateThana();
  const updateThana = useUpdateThana();
  const { data: divisions } = useDivisions();

  const form = useForm<ThanaFormValues>({
    resolver: zodResolver(thanaSchema),
    defaultValues: {
      name: "",
      division_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (thana) {
      form.reset({
        name: thana.name,
        division_id: thana.division_id,
        is_active: thana.is_active,
      });
    } else {
      form.reset({
        name: "",
        division_id: "",
        is_active: true,
      });
    }
  }, [thana, form]);

  const onSubmit = async (values: ThanaFormValues) => {
    const data = {
      name: values.name,
      division_id: values.division_id,
      is_active: values.is_active,
    };
    if (thana) {
      await updateThana.mutateAsync({ id: thana.id, ...data });
    } else {
      await createThana.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{thana ? "Edit Thana" : "Add Thana"}</DialogTitle>
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
                    <Input placeholder="Thana name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="division_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive thanas won't appear in dropdowns
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
              <Button type="submit" disabled={createThana.isPending || updateThana.isPending}>
                {thana ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ThanaModal;
