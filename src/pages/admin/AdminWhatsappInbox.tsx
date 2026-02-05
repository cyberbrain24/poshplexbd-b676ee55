import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Send, CheckCheck, Check, User, MessageCircle, Archive, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminWhatsappInbox = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["whatsapp-messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !messageInput.trim()) return;

      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: selectedConversation,
        direction: "outbound",
        message_type: "text",
        content: messageInput,
        status: "sent",
      });
      if (error) throw error;

      // Update conversation
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message: messageInput,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", selectedConversation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      setMessageInput("");
    },
    onError: (error: any) => {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    },
  });

  const filteredConversations = conversations?.filter(
    (conv) =>
      conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery)
  );

  const selectedConv = conversations?.find((c) => c.id === selectedConversation);

  const getMessageStatus = (status: string) => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] flex border rounded-lg overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            ) : (
              filteredConversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedConversation === conv.id && "bg-muted"
                  )}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {conv.customer_name || conv.phone}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge className="bg-green-500">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      <span className="text-xs text-muted-foreground">
                        {conv.last_message_at &&
                          format(new Date(conv.last_message_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedConv?.customer_name || selectedConv?.phone}
                    </div>
                    <div className="text-sm text-muted-foreground">{selectedConv?.phone}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground">Loading messages...</div>
                  ) : messages?.length === 0 ? (
                    <div className="text-center text-muted-foreground">No messages yet</div>
                  ) : (
                    messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.direction === "outbound" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            msg.direction === "outbound"
                              ? "bg-green-500 text-white"
                              : "bg-muted"
                          )}
                        >
                          {msg.media_url && (
                            <img
                              src={msg.media_url}
                              alt="Media"
                              className="rounded mb-2 max-w-full"
                            />
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              msg.direction === "outbound" ? "text-green-100" : "text-muted-foreground"
                            )}
                          >
                            <span className="text-xs">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {msg.direction === "outbound" && getMessageStatus(msg.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessageMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsappInbox;
