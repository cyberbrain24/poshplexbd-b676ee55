import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    product_images?: { image_url: string; is_main: boolean }[];
  };
}

// Fetch reviews for a specific customer
export const useCustomerReviews = (customerId: string | null) => {
  return useQuery({
    queryKey: ["customer-reviews", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          product:products(
            id,
            name,
            sku,
            product_images(image_url, is_main)
          )
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!customerId,
  });
};

// Fetch reviews for a specific product (approved only for public)
export const useProductReviews = (productId: string | null) => {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
};

// Create a new review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customer_id: string;
      product_id: string;
      rating: number;
      title?: string;
      content: string;
    }) => {
      const { data: result, error } = await supabase
        .from("reviews")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-reviews", variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", variables.product_id] });
    },
  });
};

// Update a review
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        rating?: number;
        title?: string;
        content?: string;
      };
    }) => {
      const { data: result, error } = await supabase
        .from("reviews")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
};

// Delete a review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
};
