import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSEOMutations, SEOMetadata } from "@/hooks/useSEO";
import SeoPreviewCard from "./SeoPreviewCard";
import { toast } from "sonner";

const seoSchema = z.object({
  page_path: z.string().min(1, "Path is required").startsWith("/", "Path must start with /"),
  meta_title: z.string().max(60, "Title should be under 60 characters").optional().or(z.literal("")),
  meta_description: z.string().max(160, "Description should be under 160 characters").optional().or(z.literal("")),
  focus_keywords: z.string().optional(),
  og_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  canonical_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  no_index: z.boolean().default(false),
  json_ld_type: z.string().optional(),
  priority: z.string().optional(),
  change_frequency: z.string().optional(),
});

type SEOFormValues = z.infer<typeof seoSchema>;

interface SEOPathModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seoData: SEOMetadata | null;
}

const SEOPathModal = ({ open, onOpenChange, seoData }: SEOPathModalProps) => {
  const { upsertSEO } = useSEOMutations();
  const isEditing = !!seoData;

  const form = useForm<SEOFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      page_path: "",
      meta_title: "",
      meta_description: "",
      focus_keywords: "",
      og_image: "",
      canonical_url: "",
      no_index: false,
      json_ld_type: "",
      priority: "0.5",
      change_frequency: "weekly",
    },
  });

  useEffect(() => {
    if (seoData) {
      form.reset({
        page_path: seoData.page_path,
        meta_title: seoData.meta_title || "",
        meta_description: seoData.meta_description || "",
        focus_keywords: seoData.focus_keywords?.join(", ") || "",
        og_image: seoData.og_image || "",
        canonical_url: seoData.canonical_url || "",
        no_index: seoData.no_index,
        json_ld_type: seoData.json_ld_type || "",
        priority: String(seoData.priority || 0.5),
        change_frequency: seoData.change_frequency || "weekly",
      });
    } else {
      form.reset({
        page_path: "",
        meta_title: "",
        meta_description: "",
        focus_keywords: "",
        og_image: "",
        canonical_url: "",
        no_index: false,
        json_ld_type: "",
        priority: "0.5",
        change_frequency: "weekly",
      });
    }
  }, [seoData, form]);

  const onSubmit = async (values: SEOFormValues) => {
    try {
      const payload = {
        page_path: values.page_path,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        focus_keywords: values.focus_keywords
          ? values.focus_keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : null,
        og_image: values.og_image || null,
        canonical_url: values.canonical_url || null,
        no_index: values.no_index,
        json_ld_type: values.json_ld_type || null,
        priority: parseFloat(values.priority || "0.5"),
        change_frequency: values.change_frequency || "weekly",
        is_dynamic: false, // Custom paths are not dynamic
      };

      await upsertSEO.mutateAsync(payload);
      toast.success(isEditing ? "SEO updated" : "SEO path created");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save SEO data");
    }
  };

  const watchTitle = form.watch("meta_title");
  const watchDescription = form.watch("meta_description");
  const watchPath = form.watch("page_path");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit SEO Settings" : "Add Custom SEO Path"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="page_path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Path</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/about-us"
                          {...field}
                          disabled={isEditing && seoData?.is_dynamic}
                        />
                      </FormControl>
                      <FormDescription>
                        The URL path (e.g., /products/my-product)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Meta Title
                        <span className="text-muted-foreground ml-2">
                          ({(field.value?.length || 0)}/60)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Page Title | Poshplex"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Meta Description
                        <span className="text-muted-foreground ml-2">
                          ({(field.value?.length || 0)}/160)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A compelling description for search results..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="focus_keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Keywords</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="fashion, jewelry, premium"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="og_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Image</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Image shown when shared on social media
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="canonical_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://poshplexbd.lovable.app/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The preferred URL for this content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="json_ld_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schema Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schema type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WebPage">WebPage</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Article">Article</SelectItem>
                          <SelectItem value="CollectionPage">Collection</SelectItem>
                          <SelectItem value="AboutPage">About Page</SelectItem>
                          <SelectItem value="ContactPage">Contact Page</SelectItem>
                          <SelectItem value="FAQPage">FAQ Page</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitemap Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1.0">1.0 (Highest)</SelectItem>
                            <SelectItem value="0.8">0.8</SelectItem>
                            <SelectItem value="0.5">0.5 (Default)</SelectItem>
                            <SelectItem value="0.3">0.3</SelectItem>
                            <SelectItem value="0.1">0.1 (Lowest)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="change_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Change Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="no_index"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>No Index</FormLabel>
                        <FormDescription>
                          Prevent search engines from indexing this page
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <SeoPreviewCard
                  title={watchTitle || "Page Title | Poshplex"}
                  description={watchDescription || "Meta description will appear here..."}
                  url={`poshplexbd.lovable.app${watchPath}`}
                />

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Social Media Preview</p>
                  <div className="bg-background border rounded-lg overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">OG Image Preview</span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground uppercase">poshplexbd.lovable.app</p>
                      <p className="font-medium text-sm mt-1">{watchTitle || "Page Title"}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {watchDescription || "Description will appear here"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertSEO.isPending}>
                {upsertSEO.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SEOPathModal;
