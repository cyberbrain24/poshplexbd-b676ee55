import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Division {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Thana {
  id: string;
  name: string;
  division_id: string;
  is_active: boolean;
  shipping_cost?: number;
}

export const useDivisions = () => {
  return useQuery({
    queryKey: ["divisions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Division[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useThanas = (divisionId?: string) => {
  return useQuery({
    queryKey: ["thanas-public", divisionId],
    queryFn: async () => {
      let query = supabase
        .from("thanas")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Thana[];
    },
    enabled: !!divisionId,
    staleTime: 1000 * 60 * 10,
  });
};
