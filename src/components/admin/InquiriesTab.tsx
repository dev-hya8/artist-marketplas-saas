import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Inquiry {
  id: string;
  artwork_id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  artworks?: {
    title: string;
  };
}

export const InquiriesTab = () => {
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          artworks (
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Inquiry[];
    },
  });

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading inquiries...</div>;
  }

  if (!inquiries || inquiries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No inquiries yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <Card key={inquiry.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{inquiry.name}</CardTitle>
                <CardDescription>{inquiry.email}</CardDescription>
              </div>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inquiry.artworks && (
                <p className="text-sm font-medium">
                  Re: <span className="text-muted-foreground">{inquiry.artworks.title}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
