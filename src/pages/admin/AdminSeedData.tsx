import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Database, Package, Palette, Ruler, Layers, Tag, FolderTree, Trash2, CheckCircle2, XCircle } from "lucide-react";
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

interface SeedJob {
  id: string;
  status: string;
  total_products: number;
  products_created: number;
  variants_created: number;
  images_created: number;
  current_batch: number;
  total_batches: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const AdminSeedData = () => {
  const [productCount, setProductCount] = useState(1000);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [currentJob, setCurrentJob] = useState<SeedJob | null>(null);
  const queryClient = useQueryClient();

  // Subscribe to job updates via realtime
  useEffect(() => {
    if (!currentJob?.id) return;

    const channel = supabase
      .channel(`seed-job-${currentJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seed_jobs',
          filter: `id=eq.${currentJob.id}`,
        },
        (payload) => {
          const updatedJob = payload.new as SeedJob;
          setCurrentJob(updatedJob);

          if (updatedJob.status === 'completed') {
            toast.success(`Successfully generated ${updatedJob.products_created} products!`);
            setIsSeeding(false);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products-list'] });
          } else if (updatedJob.status === 'failed') {
            toast.error(`Seeding failed: ${updatedJob.error_message}`);
            setIsSeeding(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJob?.id, queryClient]);

  // Poll for job status as backup (in case realtime misses updates)
  useEffect(() => {
    if (!currentJob?.id || !isSeeding) return;

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('seed_jobs')
        .select('*')
        .eq('id', currentJob.id)
        .single();

      if (data) {
        setCurrentJob(data as SeedJob);
        if (data.status === 'completed' || data.status === 'failed') {
          setIsSeeding(false);
          if (data.status === 'completed') {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products-list'] });
          }
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentJob?.id, isSeeding, queryClient]);

  const handleSeed = async () => {
    setIsSeeding(true);
    setCurrentJob(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-products', {
        body: { productCount }
      });

      if (error) throw error;

      if (data.success && data.jobId) {
        // Fetch the initial job state
        const { data: jobData } = await supabase
          .from('seed_jobs')
          .select('*')
          .eq('id', data.jobId)
          .single();

        if (jobData) {
          setCurrentJob(jobData as SeedJob);
          toast.info('Seeding started! This will run in the background.');
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error(`Failed to start seeding: ${error.message}`);
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
      setCurrentJob(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(`Failed to clear: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const progressPercentage = currentJob?.total_batches 
    ? Math.round((currentJob.current_batch / currentJob.total_batches) * 100) 
    : 0;

  const getStatusIcon = () => {
    if (!currentJob) return null;
    switch (currentJob.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
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
              Runs in the background - you can navigate away.
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
                This will generate approximately {productCount * 12} variants (avg 12 per product)
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
                  Seeding in Progress...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate {productCount} Products
                </>
              )}
            </Button>
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
                <Button variant="destructive" className="w-full" disabled={isClearing || isSeeding}>
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

      {/* Progress Card */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {currentJob.status === 'completed' ? 'Seeding Complete' : 
               currentJob.status === 'failed' ? 'Seeding Failed' : 
               'Seeding Progress'}
            </CardTitle>
            <CardDescription>
              {currentJob.status === 'running' && `Batch ${currentJob.current_batch} of ${currentJob.total_batches}`}
              {currentJob.status === 'completed' && 'All products have been generated successfully'}
              {currentJob.status === 'failed' && currentJob.error_message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentJob.status === 'running' && (
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">{progressPercentage}% complete</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{currentJob.products_created.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Layers className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{currentJob.variants_created.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Variants</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{currentJob.images_created.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Images</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{currentJob.total_products.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Target</p>
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
                <li>• 2-3 random colors</li>
                <li>• 3-4 random sizes</li>
                <li>• 1-2 random materials</li>
                <li>• 2-3 product images</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeedData;
