import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Search, 
  Send, 
  Image, 
  User, 
  Link2, 
  CheckCheck, 
  Instagram,
  ShoppingBag,
  Clock
} from "lucide-react";

const AdminInstagramInbox = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [linkCustomerId, setLinkCustomerId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["instagram-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_conversations")
        .select(`
          *,
          customers (id, name, phone)
        `)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["instagram-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const { data, error } = await supabase
        .from("instagram_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation?.id,
  });

  const { data: customerOrders = [] } = useQuery({
    queryKey: ["customer-orders", selectedConversation?.customer_id],
    queryFn: async () => {
      // Placeholder for order data - would connect to orders table
      return [];
    },
    enabled: !!selectedConversation?.customer_id,
  });

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversation?.unread_count > 0) {
      supabase
        .from("instagram_conversations")
        .update({ unread_count: 0 })
        .eq("id", selectedConversation.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["instagram-conversations"] });
        });
    }
  }, [selectedConversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Insert message into local DB
      const { error } = await supabase.from("instagram_messages").insert({
        conversation_id: selectedConversation.id,
        direction: "outbound",
        message_type: "text",
        content,
        status: "sent",
      });
      if (error) throw error;

      // Update conversation
      await supabase
        .from("instagram_conversations")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", selectedConversation.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-messages", selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["instagram-conversations"] });
      setNewMessage("");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const linkCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from("instagram_conversations")
        .update({ customer_id: customerId })
        .eq("id", selectedConversation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-conversations"] });
      toast.success("Customer linked");
      setLinkCustomerId("");
    },
    onError: () => {
      toast.error("Failed to link customer");
    },
  });

  const handleSend = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const filteredConversations = conversations.filter((c: any) =>
    (c.instagram_username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.customers?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] flex border rounded-lg overflow-hidden">
        {/* Left - Conversation List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations</div>
            ) : (
              filteredConversations.map((conv: any) => (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer border-b transition-colors ${
                    selectedConversation?.id === conv.id
                      ? "bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      {conv.instagram_profile_pic ? (
                        <img src={conv.instagram_profile_pic} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        <Instagram className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium truncate ${conv.unread_count > 0 ? "font-bold" : ""}`}>
                          @{conv.instagram_username || "Unknown"}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="ml-2">{conv.unread_count}</Badge>
                        )}
                      </div>
                      {conv.customers && (
                        <p className="text-xs text-muted-foreground truncate">
                          → {conv.customers.name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.last_message || "No messages"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Middle - Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">@{selectedConversation.instagram_username || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.instagram_user_id}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">No messages yet</div>
                  ) : (
                    messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
                          {msg.media_url && (
                            <img src={msg.media_url} alt="" className="rounded-lg mb-2 max-w-full" />
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.direction === "outbound" ? "justify-end" : ""
                          }`}>
                            <span className="text-xs opacity-70">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {msg.direction === "outbound" && msg.status === "read" && (
                              <CheckCheck className="h-3 w-3 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>

        {/* Right - Customer Context */}
        {selectedConversation && (
          <div className="w-72 border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                ERP Customer Data
              </h3>
            </div>

            <ScrollArea className="flex-1 p-4">
              {selectedConversation.customers ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedConversation.customers.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedConversation.customers.phone}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4" />
                      Recent Orders
                    </p>
                    {customerOrders.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">No orders found</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {/* Order list would go here */}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This Instagram user is not linked to a customer.
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-2">Link to Customer</p>
                    <div className="flex gap-2">
                      <Input
                        value={linkCustomerId}
                        onChange={(e) => setLinkCustomerId(e.target.value)}
                        placeholder="Customer ID"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => linkCustomerMutation.mutate(linkCustomerId)}
                        disabled={!linkCustomerId || linkCustomerMutation.isPending}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* 24h Window Indicator */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className="text-muted-foreground">Last interaction:</span>
              </div>
              {selectedConversation.last_interaction_at ? (
                <p className="text-sm font-medium mt-1">
                  {format(new Date(selectedConversation.last_interaction_at), "PPp")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Unknown</p>
              )}
              {selectedConversation.last_interaction_at && (
                <Badge
                  variant={
                    new Date(selectedConversation.last_interaction_at) >
                    new Date(Date.now() - 24 * 60 * 60 * 1000)
                      ? "default"
                      : "secondary"
                  }
                  className="mt-2"
                >
                  {new Date(selectedConversation.last_interaction_at) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ? "✓ In 24h Window"
                    : "Outside 24h Window"}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInstagramInbox;
