import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, RefreshCw, CheckCircle, XCircle, Instagram } from "lucide-react";
import { toast } from "sonner";
import InstagramApiModal from "@/components/admin/InstagramApiModal";

interface PermissionsStatus {
  instagram_manage_messages?: boolean;
  instagram_manage_comments?: boolean;
  pages_manage_metadata?: boolean;
}

interface InstagramApi {
  id: string;
  provider_name: string;
  facebook_app_id: string;
  facebook_app_secret: string;
  access_token: string;
  page_id: string | null;
  page_name: string | null;
  instagram_account_id: string | null;
  instagram_username: string | null;
  webhook_url: string | null;
  webhook_verify_token: string | null;
  permissions_status: PermissionsStatus | null;
  token_expires_at: string | null;
  is_active: boolean;
  status: string;
  created_at: string;
}

const AdminInstagramApi = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<InstagramApi | null>(null);
  const queryClient = useQueryClient();

  const { data: apis = [], isLoading } = useQuery({
    queryKey: ["instagram-apis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_apis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((api) => ({
        ...api,
        permissions_status: api.permissions_status as PermissionsStatus | null,
      })) as InstagramApi[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_apis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-apis"] });
      toast.success("Instagram API deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete Instagram API");
    },
  });

  const filteredApis = apis.filter((api) =>
    api.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (api.instagram_username && api.instagram_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (api: InstagramApi) => {
    setEditingApi(api);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApi(null);
  };

  const getPermissionBadge = (granted: boolean) => {
    return granted ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Instagram API</h1>
            <p className="text-muted-foreground">
              Manage Instagram Business API connections
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add API
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search APIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Instagram Account</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredApis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No Instagram APIs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApis.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">{api.provider_name}</TableCell>
                    <TableCell>
                      {api.instagram_username ? (
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          @{api.instagram_username}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>{api.page_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Messages:</span>
                        {getPermissionBadge(api.permissions_status?.instagram_manage_messages ?? false)}
                        <span className="text-xs ml-2">Comments:</span>
                        {getPermissionBadge(api.permissions_status?.instagram_manage_comments ?? false)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={api.status === "connected" ? "default" : "secondary"}
                        className={api.status === "connected" ? "bg-green-500" : ""}
                      >
                        {api.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={api.is_active ? "default" : "secondary"}>
                        {api.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(api)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(api.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <InstagramApiModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        editingApi={editingApi}
      />
    </>
  );
};

export default AdminInstagramApi;
