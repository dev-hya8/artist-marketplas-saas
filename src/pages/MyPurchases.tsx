import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, FileText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Invoice {
  id: string;
  invoice_number: string;
  sale_date: string;
  final_sale_price: number;
  total_amount: number;
  transaction_status: string;
  pdf_url: string | null;
  coa_url: string | null;
  shipping_date: string | null;
  tracking_number: string | null;
  carrier_name: string | null;
  artworks: {
    title: string;
    image_url: string | null;
  } | null;
}

export default function MyPurchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
    fetchTransactionHistory();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserEmail(session.user.email || "");
  };

  const fetchTransactionHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call the edge function with automatic JWT token inclusion
      const { data, error } = await supabase.functions.invoke('get-transaction-history', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Purchases</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No purchase history found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {invoice.artworks?.title || "Artwork"}
                      </CardTitle>
                      <CardDescription>
                        Invoice #{invoice.invoice_number} • {formatDate(invoice.sale_date)}
                      </CardDescription>
                    </div>
                    <Badge variant={invoice.transaction_status === 'completed' ? 'default' : 'secondary'}>
                      {invoice.transaction_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</span>
                  </div>

                  {invoice.shipping_date && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Shipping Information</span>
                        </div>
                        <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                          <p>Shipped: {formatDate(invoice.shipping_date)}</p>
                          {invoice.carrier_name && <p>Carrier: {invoice.carrier_name}</p>}
                          {invoice.tracking_number && <p>Tracking: {invoice.tracking_number}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  
                  <div className="flex gap-2">
                    {invoice.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          View Invoice
                        </a>
                      </Button>
                    )}
                    {invoice.coa_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.coa_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          View COA
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}