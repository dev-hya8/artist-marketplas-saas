import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Archive, Trash2, RotateCcw, Trash, Mail, Eye, EyeOff, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Hook to get unread count
export const useUnreadInquiriesCount = () => {
  return useQuery({
    queryKey: ["unreadInquiriesCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("inquiries")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("status", "inbox");
      
      if (error) throw error;
      return count || 0;
    },
  });
};

interface Inquiry {
  id: string;
  artwork_id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status: string;
  is_read: boolean;
  is_favorite: boolean;
  artworks?: {
    title: string;
    image_url: string;
  };
}

export const InquiriesTab = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["inquiries", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("inquiries")
        .select(`
          *,
          artworks (
            title,
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      // Filter based on active tab
      if (activeTab === "favorites") {
        query = query.eq("is_favorite", true);
      } else if (activeTab === "inbox" || activeTab === "archived" || activeTab === "trash") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;

      console.log('Fetched inquiries:', data);

      if (error) throw error;
      return data as Inquiry[];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ is_read: true })
        .eq("id", inquiryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["unreadInquiriesCount"] });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({ description: "Updated successfully" });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({ description: "Moved successfully" });
    },
  });

  // Delete permanently mutation
  const deletePermanentlyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({ description: "Deleted permanently" });
    },
  });

  const handleCardClick = (inquiry: Inquiry) => {
    // Toggle expand/collapse
    if (expandedId === inquiry.id) {
      setExpandedId(null);
    } else {
      setExpandedId(inquiry.id);
      // Auto-mark as read when expanded
      if (!inquiry.is_read) {
        markAsReadMutation.mutate(inquiry.id);
      }
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, inquiry: Inquiry) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ is_read: !inquiry.is_read })
        .eq("id", inquiry.id);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["inquiries"] });
        queryClient.invalidateQueries({ queryKey: ["unreadInquiriesCount"] });
      }
    } catch (error) {
      console.error("Error toggling read status:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading inquiries...</div>;
  }

  const renderInquiryCard = (inquiry: Inquiry) => {
    const isExpanded = expandedId === inquiry.id;
    
    return (
      <Card 
        key={inquiry.id} 
        className={`relative transition-all duration-200 ${
          isExpanded 
            ? 'shadow-lg' 
            : inquiry.is_read 
              ? 'bg-background hover:bg-accent/30 cursor-pointer' 
              : 'bg-muted/50 hover:bg-muted cursor-pointer'
        }`}
      >
        {!inquiry.is_read && (
          <div className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
        
        <CardHeader onClick={() => handleCardClick(inquiry)} className="cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 pl-4">
              {inquiry.artworks?.image_url && (
                <img 
                  src={inquiry.artworks.image_url} 
                  alt={inquiry.artworks.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="space-y-1 flex-1">
                <CardTitle className={`text-lg ${!inquiry.is_read ? 'font-bold' : 'font-medium'}`}>
                  {inquiry.name}
                </CardTitle>
                <CardDescription className={!inquiry.is_read ? 'font-semibold text-foreground' : ''}>
                  {inquiry.email}
                </CardDescription>
                <p className="text-xs text-muted-foreground">
                  {inquiry.artworks ? inquiry.artworks.title : 'General Inquiry'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => handleToggleRead(e, inquiry)}
              >
                {inquiry.is_read ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-primary" />
                )}
              </Button>
              {isExpanded && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {!isExpanded && (
                <Badge variant="outline">
                  {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                </Badge>
              )}
            </div>
          </div>
          
          {!isExpanded && (
            <p className="text-sm text-muted-foreground pl-4 line-clamp-1 mt-2">
              {inquiry.message}
            </p>
          )}
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Received {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}</span>
                <Badge variant="outline">{inquiry.status}</Badge>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {inquiry.message}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {activeTab !== "trash" ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const artworkTitle = inquiry.artworks ? inquiry.artworks.title : 'your inquiry';
                        const subject = `Re: Inquiry about ${artworkTitle}`;
                        const body = `Hi ${inquiry.name},\n\nThank you for your interest in ${artworkTitle}.\n\n(Original Message: "${inquiry.message}")`;
                        window.location.href = `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFavoriteMutation.mutate({ 
                        id: inquiry.id, 
                        isFavorite: inquiry.is_favorite 
                      })}
                    >
                      <Star className={`h-4 w-4 mr-1 ${inquiry.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {inquiry.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        id: inquiry.id, 
                        status: 'archived' 
                      })}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        id: inquiry.id, 
                        status: 'trash' 
                      })}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Move to Trash
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        id: inquiry.id, 
                        status: 'inbox' 
                      })}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePermanentlyMutation.mutate(inquiry.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete Forever
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="inbox">Inbox</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
        <TabsTrigger value="trash">Trash</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        {!inquiries || inquiries.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No inquiries in {activeTab}.
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => renderInquiryCard(inquiry))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
