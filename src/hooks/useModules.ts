import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SystemModule {
  id: string;
  module_key: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  is_core: boolean;
  sort_order: number;
  parent_module_key: string | null;
  routes: string[];
  created_at: string;
  updated_at: string;
}

export const useModules = () => {
  return useQuery({
    queryKey: ["system-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SystemModule[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useActiveModules = () => {
  return useQuery({
    queryKey: ["system-modules", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as SystemModule[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useToggleModule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("system_modules")
        .update({ is_active })
        .eq("id", id)
        .eq("is_core", false) // Prevent toggling core modules
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["system-modules"] });
      toast({
        title: data.is_active ? "Module activated" : "Module deactivated",
        description: `${data.name} has been ${data.is_active ? "activated" : "deactivated"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update module",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Helper to check if a route is accessible
export const isRouteActive = (modules: SystemModule[] | undefined, pathname: string): boolean => {
  if (!modules) return true; // Default to accessible while loading
  
  // Check if the route belongs to any active module
  for (const module of modules) {
    if (module.routes.some(route => {
      // Exact match or starts with (for nested routes)
      return pathname === route || pathname.startsWith(route + '/');
    })) {
      return module.is_active;
    }
  }
  
  return true; // Default to accessible for unknown routes
};

// Get all active routes
export const getActiveRoutes = (modules: SystemModule[] | undefined): string[] => {
  if (!modules) return [];
  return modules
    .filter(m => m.is_active)
    .flatMap(m => m.routes);
};
