import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Database, Package, Palette, Ruler, Layers, Tag, FolderTree, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SeedStats {
  products: number;
  variants: number;
  images: number;
  colors: number;
  sizes: number;
  materials: number;
  brands: number;
  categories: number;
}

const AdminSeedData = () => {
  const [productCount, setProductCount] = useState(1000);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState<SeedStats | null>(null);
  const queryClient = useQueryClient();

  const handleSeed = async () => {
    setIsSeeding(true);
    setStats(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-products', {
        body: { productCount }
      });

      if (error) throw error;

      if (data.success) {
        setStats(data.stats);
        toast.success(data.message);
        // Invalidate product queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products-list'] });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error(`Seeding failed: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearProducts = async () => {
    setIsClearing(true);

    try {
      // Delete in order: images -> variants -> products
      const { error: imgError } = await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (imgError) throw imgError;

      const { error: varError } = await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (varError) throw varError;

      const { error: prodError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (prodError) throw prodError;

      toast.success('All products cleared successfully');
      setStats(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(`Failed to clear: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seed Data</h1>
        <p className="text-muted-foreground">Generate realistic dummy products with variations for testing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Generate Products
            </CardTitle>
            <CardDescription>
              Create realistic dummy products with color, size, and material variants. 
              Each product will have 2-5 colors, 3-6 sizes, and 1-3 materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productCount">Number of Products</Label>
              <Input
                id="productCount"
                type="number"
                min={1}
                max={5000}
                value={productCount}
                onChange={(e) => setProductCount(Number(e.target.value))}
                disabled={isSeeding}
              />
              <p className="text-xs text-muted-foreground">
                This will generate approximately {productCount * 20} variants (avg 20 per product)
              </p>
            </div>

            <Button 
              onClick={handleSeed} 
              disabled={isSeeding || productCount < 1}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Products...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate {productCount} Products
                </>
              )}
            </Button>

            {isSeeding && (
              <div className="space-y-2">
                <Progress value={undefined} className="animate-pulse" />
                <p className="text-sm text-muted-foreground text-center">
                  This may take a few minutes for large datasets...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Clear Data
            </CardTitle>
            <CardDescription>
              Remove all products, variants, and images from the database. 
              This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isClearing}>
                  {isClearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Products
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all products, variants, and images from your database. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProducts} className="bg-destructive hover:bg-destructive/90">
                    Yes, clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Seed Results</CardTitle>
            <CardDescription>Summary of generated data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.products.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Layers className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.variants.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Variants</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Palette className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.colors}</p>
                  <p className="text-sm text-muted-foreground">Colors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Ruler className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.sizes}</p>
                  <p className="text-sm text-muted-foreground">Sizes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Tag className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.materials}</p>
                  <p className="text-sm text-muted-foreground">Materials</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <FolderTree className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.categories}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Tag className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.brands}</p>
                  <p className="text-sm text-muted-foreground">Brands</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.images.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Images</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What Gets Generated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Product Categories</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• T-Shirts, Hoodies, Jeans</li>
                <li>• Jackets, Dresses, Shirts</li>
                <li>• Pants, Sweaters, Shorts, Skirts</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Colors (15)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Black, White, Navy, Gray</li>
                <li>• Burgundy, Olive, Forest Green</li>
                <li>• Dusty Rose, Coral, Mustard...</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Sizes (6)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• XS, S, M, L, XL, XXL</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Materials (10)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 100% Cotton, Organic Cotton</li>
                <li>• French Terry, Fleece, Linen</li>
                <li>• Denim, Wool Blend, Jersey...</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Brands (10)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• LINEA, Urban Core, Heritage Co.</li>
                <li>• Studio Label, Essential Wear</li>
                <li>• Prime Basics, Modern Thread...</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Per Product</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 2-5 random colors</li>
                <li>• 3-6 random sizes</li>
                <li>• 1-3 random materials</li>
                <li>• 2-4 product images</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeedData;
