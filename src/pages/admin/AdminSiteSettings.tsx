import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Globe, Image, Menu, Footprints, Plus, Trash2, GripVertical, Save, Upload, FileText } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSiteSettings, useSiteSettingsMutation, MenuLink, FooterColumn } from "@/hooks/useSiteSettings";
import { usePublishedPages } from "@/hooks/usePages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuLinkSchema = z.object({
  label: z.string().min(1, "Label required"),
  path: z.string().min(1, "Path required"),
});

const footerColumnSchema = z.object({
  title: z.string().min(1, "Title required"),
  links: z.array(menuLinkSchema),
});

const settingsSchema = z.object({
  site_name: z.string().min(1, "Site name required"),
  tagline: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  logo_dark_url: z.string().optional().nullable(),
  favicon_url: z.string().optional().nullable(),
  header_menu: z.array(menuLinkSchema),
  footer_copyright: z.string().optional().nullable(),
  footer_contact_email: z.string().email().optional().nullable().or(z.literal("")),
  footer_contact_phone: z.string().optional().nullable(),
  footer_address: z.string().optional().nullable(),
  social_instagram: z.string().optional(),
  social_facebook: z.string().optional(),
  social_twitter: z.string().optional(),
  social_pinterest: z.string().optional(),
  social_youtube: z.string().optional(),
  social_tiktok: z.string().optional(),
  footer_columns: z.array(footerColumnSchema),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const AdminSiteSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const mutation = useSiteSettingsMutation();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const { data: publishedPages } = usePublishedPages();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      site_name: settings.site_name,
      tagline: settings.tagline || "",
      logo_url: settings.logo_url || "",
      logo_dark_url: settings.logo_dark_url || "",
      favicon_url: settings.favicon_url || "",
      header_menu: settings.header_menu || [],
      footer_copyright: settings.footer_copyright || "",
      footer_contact_email: settings.footer_contact_email || "",
      footer_contact_phone: settings.footer_contact_phone || "",
      footer_address: settings.footer_address || "",
      social_instagram: settings.social_links?.instagram || "",
      social_facebook: settings.social_links?.facebook || "",
      social_twitter: settings.social_links?.twitter || "",
      social_pinterest: settings.social_links?.pinterest || "",
      social_youtube: settings.social_links?.youtube || "",
      social_tiktok: settings.social_links?.tiktok || "",
      footer_columns: settings.footer_columns || [],
    } : undefined,
  });

  const { fields: menuFields, append: appendMenu, remove: removeMenu } = useFieldArray({
    control: form.control,
    name: "header_menu",
  });

  const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
    control: form.control,
    name: "footer_columns",
  });

  const handleFileUpload = async (
    file: File,
    field: "logo_url" | "logo_dark_url" | "favicon_url",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${field}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      form.setValue(field, urlData.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await mutation.mutateAsync({
        site_name: values.site_name,
        tagline: values.tagline || null,
        logo_url: values.logo_url || null,
        logo_dark_url: values.logo_dark_url || null,
        favicon_url: values.favicon_url || null,
        header_menu: values.header_menu as unknown as MenuLink[],
        footer_copyright: values.footer_copyright || null,
        footer_contact_email: values.footer_contact_email || null,
        footer_contact_phone: values.footer_contact_phone || null,
        footer_address: values.footer_address || null,
        social_links: {
          instagram: values.social_instagram || "",
          facebook: values.social_facebook || "",
          twitter: values.social_twitter || "",
          pinterest: values.social_pinterest || "",
          youtube: values.social_youtube || "",
          tiktok: values.social_tiktok || "",
        },
        footer_columns: values.footer_columns as unknown as FooterColumn[],
      });
      toast.success("Site settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Site Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your site branding, navigation, and footer content
            </p>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="navigation" className="flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Navigation
                </TabsTrigger>
                <TabsTrigger value="footer" className="flex items-center gap-2">
                  <Footprints className="h-4 w-4" />
                  Footer
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Social
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle>Visual Identity</CardTitle>
                    <CardDescription>
                      Configure your site logo, favicon, and brand name
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="site_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Poshplex" />
                            </FormControl>
                            <FormDescription>
                              Used in browser titles and alt text
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tagline</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="Premium Fashion & Jewelry" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-6">
                      {/* Logo Upload */}
                      <div className="space-y-3">
                        <Label>Logo (Light Mode)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {form.watch("logo_url") ? (
                            <img
                              src={form.watch("logo_url") || ""}
                              alt="Logo"
                              className="h-16 mx-auto object-contain"
                            />
                          ) : (
                            <div className="h-16 flex items-center justify-center text-muted-foreground">
                              No logo uploaded
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "logo_url", setUploadingLogo);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              disabled={uploadingLogo}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingLogo ? "Uploading..." : "Upload"}
                            </Button>
                          </label>
                        </div>
                      </div>

                      {/* Dark Logo Upload */}
                      <div className="space-y-3">
                        <Label>Logo (Dark Mode)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-zinc-900">
                          {form.watch("logo_dark_url") ? (
                            <img
                              src={form.watch("logo_dark_url") || ""}
                              alt="Dark Logo"
                              className="h-16 mx-auto object-contain"
                            />
                          ) : (
                            <div className="h-16 flex items-center justify-center text-zinc-400">
                              No logo uploaded
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "logo_dark_url", setUploadingLogoDark);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              disabled={uploadingLogoDark}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingLogoDark ? "Uploading..." : "Upload"}
                            </Button>
                          </label>
                        </div>
                      </div>

                      {/* Favicon Upload */}
                      <div className="space-y-3">
                        <Label>Favicon</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {form.watch("favicon_url") ? (
                            <img
                              src={form.watch("favicon_url") || ""}
                              alt="Favicon"
                              className="h-16 w-16 mx-auto object-contain"
                            />
                          ) : (
                            <div className="h-16 flex items-center justify-center text-muted-foreground">
                              No favicon
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*,.ico"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "favicon_url", setUploadingFavicon);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              disabled={uploadingFavicon}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingFavicon ? "Uploading..." : "Upload"}
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Navigation Tab */}
              <TabsContent value="navigation">
                <Card>
                  <CardHeader>
                    <CardTitle>Header Navigation</CardTitle>
                    <CardDescription>
                      Configure the main navigation menu items
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {menuFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <FormField
                          control={form.control}
                          name={`header_menu.${index}.label`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} placeholder="Label" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`header_menu.${index}.path`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} placeholder="/path or https://..." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMenu(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendMenu({ label: "", path: "" })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Menu Item
                      </Button>

                      {/* Quick Add from CMS Pages */}
                      {publishedPages && publishedPages.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="secondary">
                              <FileText className="h-4 w-4 mr-2" />
                              Add CMS Page
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Published Pages</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {publishedPages.map((page) => (
                              <DropdownMenuItem
                                key={page.id}
                                onClick={() => appendMenu({ 
                                  label: page.title, 
                                  path: `/page/${page.slug}` 
                                })}
                              >
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                {page.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Footer Tab */}
              <TabsContent value="footer">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Footer Information</CardTitle>
                      <CardDescription>
                        Configure footer copyright and contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="footer_copyright"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Copyright Text</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="© 2025 Poshplex. All rights reserved." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="footer_contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} type="email" placeholder="hello@poshplex.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="footer_contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="+1 234 567 890" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="footer_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} placeholder="123 Fashion Street, Dhaka, Bangladesh" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Footer Link Columns</CardTitle>
                      <CardDescription>
                        Organize footer links into columns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {columnFields.map((column, columnIndex) => (
                        <div key={column.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <FormField
                              control={form.control}
                              name={`footer_columns.${columnIndex}.title`}
                              render={({ field }) => (
                                <FormItem className="flex-1 mr-4">
                                  <FormLabel>Column Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Column Title" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeColumn(columnIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          
                          <FooterColumnLinks
                            control={form.control}
                            columnIndex={columnIndex}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendColumn({ title: "", links: [] })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Column
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>
                      Add your social media profile URLs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="social_instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://instagram.com/poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://facebook.com/poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter / X</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://twitter.com/poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_pinterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pinterest</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://pinterest.com/poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_youtube"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://youtube.com/@poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_tiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://tiktok.com/@poshplex" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

// Sub-component for footer column links
const FooterColumnLinks = ({ control, columnIndex }: { control: any; columnIndex: number }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `footer_columns.${columnIndex}.links`,
  });

  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      {fields.map((link, linkIndex) => (
        <div key={link.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`footer_columns.${columnIndex}.links.${linkIndex}.label`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Label" className="h-9" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`footer_columns.${columnIndex}.links.${linkIndex}.path`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="/path" className="h-9" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => remove(linkIndex)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ label: "", path: "" })}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Link
      </Button>
    </div>
  );
};

export default AdminSiteSettings;
