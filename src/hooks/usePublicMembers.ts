import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicMembershipType {
  id: string;
  name: string;
  description: string | null;
  show_member_since: boolean;
}

export interface PublicMember {
  id: string;
  name: string;
  profile_image_url: string | null;
  membership_assigned_at: string | null;
  customer_type: {
    id: string;
    name: string;
    show_member_since: boolean;
  };
}

export const usePublicMembershipTypes = () => {
  return useQuery({
    queryKey: ["publicMembershipTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_types")
        .select("id, name, description, show_member_since")
        .eq("show_on_public_page", true)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as PublicMembershipType[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePublicMembers = (membershipTypeId?: string) => {
  return useQuery({
    queryKey: ["publicMembers", membershipTypeId],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select(`
          id, name, profile_image_url, membership_assigned_at,
          customer_type:customer_types!inner(id, name, show_member_since)
        `)
        .eq("public_profile_visible", true)
        .eq("is_active", true)
        .not("customer_type_id", "is", null)
        .order("name");

      if (membershipTypeId) {
        query = query.eq("customer_type_id", membershipTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PublicMember[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
