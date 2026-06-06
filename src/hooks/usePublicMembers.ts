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
      const { data, error } = await supabase.rpc("get_public_members", {
        p_customer_type_id: membershipTypeId ?? null,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((row) => ({
        id: row.id,
        name: row.name,
        profile_image_url: row.profile_image_url,
        membership_assigned_at: row.membership_assigned_at,
        customer_type: {
          id: row.customer_type_id,
          name: row.customer_type_name,
          show_member_since: row.show_member_since,
        },
      })) as PublicMember[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
