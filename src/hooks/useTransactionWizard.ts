import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getOrderConfirmationEmailHtml } from "@/utils/transactionTemplates";

export type WizardStep = "artwork" | "invoice" | "coa" | "status" | "shipping" | "complete";

interface UseTransactionWizardProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export const useTransactionWizard = ({ onSuccess, onClose }: UseTransactionWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>("artwork");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [finalSalePrice, setFinalSalePrice] = useState("");
  const [shippingCost, setShippingCost] = useState("0.00");
  const [taxRate, setTaxRate] = useState("0");
  const [carrierName, setCarrierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingDate, setShippingDate] = useState<Date | undefined>(undefined);

  // Outputs
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [coaUrl, setCoaUrl] = useState<string>("");

  // Fetch available artworks
  const { data: artworks } = useQuery({
    queryKey: ["artworks-for-transaction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .in("status", ["Available", "Reserved"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleArtworkChange = (artworkId: string) => {
    setSelectedArtworkId(artworkId);
    const artwork = artworks?.find((a) => a.id === artworkId);
    if (artwork?.price) {
      setFinalSalePrice(artwork.price.toString());
    }
  };

  const validateArtworkStep = () => {
    if (!selectedArtworkId || !clientName || !clientEmail || !clientAddress || !saleDate || !finalSalePrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async () => {
    if (!validateArtworkStep()) return;
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          artworkId: selectedArtworkId,
          clientName,
          clientEmail,
          clientAddress,
          saleDate: format(saleDate!, "yyyy-MM-dd"),
          finalSalePrice: parseFloat(finalSalePrice),
          shippingCost: parseFloat(shippingCost),
          taxRate: parseFloat(taxRate),
        },
      });

      if (error) throw error;

      setInvoiceUrl(data.pdfUrl);
      setInvoiceNumber(data.invoiceNumber);

      toast({
        title: "Invoice Generated",
        description: "Your invoice has been created successfully.",
      });
      setCurrentStep("coa");
    } catch (err: any) {
      console.error("Error generating invoice:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate invoice.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCOA = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-coa", {
        body: {
          artworkId: selectedArtworkId,
          clientName,
          invoiceNumber,
          saleDate: format(saleDate!, "yyyy-MM-dd"),
          format: "pdf",
        },
      });

      if (error) throw error;

      setCoaUrl(data.coaUrl);
      toast({
        title: "COA Generated",
        description: "Certificate of Authenticity created successfully.",
      });
      setCurrentStep("status");
    } catch (err: any) {
      console.error("Error generating COA:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate COA.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("artworks")
        .update({
          status: "Sold",
          buyer_email: clientEmail,
        })
        .eq("id", selectedArtworkId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Artwork marked as sold.",
      });
      setCurrentStep("shipping");
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update artwork status.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!carrierName || !trackingNumber || !shippingDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all shipping details.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          carrier_name: carrierName,
          tracking_number: trackingNumber,
          shipping_date: format(shippingDate, "yyyy-MM-dd"),
          coa_url: coaUrl,
          transaction_status: "completed",
        })
        .eq("invoice_number", invoiceNumber);

      if (error) throw error;

      const artwork = artworks?.find((a) => a.id === selectedArtworkId);
      const emailHtml = getOrderConfirmationEmailHtml({
        clientName,
        artworkTitle: artwork?.title || "N/A",
        invoiceNumber,
        finalSalePrice,
        carrierName,
        trackingNumber,
        shippingDate,
        clientAddress,
        invoiceUrl,
        coaUrl,
      });

      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: clientEmail,
          subject: "Your Order is Confirmed!",
          html: emailHtml,
        },
      });

      if (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        toast({
          title: "Email Warning",
          description: "Order confirmed, but confirmation email failed to send.",
        });
      }

      toast({
        title: "Transaction Complete",
        description: "All transaction details have been saved successfully.",
      });
      setCurrentStep("complete");
      
      setTimeout(() => {
        onSuccess?.();
        handleReset();
      }, 2000);
    } catch (err: any) {
      console.error("Error completing transaction:", err);
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save shipping details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep("artwork");
    setSelectedArtworkId("");
    setClientName("");
    setClientEmail("");
    setClientAddress("");
    setSaleDate(new Date());
    setFinalSalePrice("");
    setShippingCost("0.00");
    setTaxRate("0");
    setCarrierName("");
    setTrackingNumber("");
    setShippingDate(undefined);
    setInvoiceNumber("");
    setInvoiceUrl("");
    setCoaUrl("");
    onClose();
  };

  const steps = [
    { id: "artwork" as WizardStep, label: "Artwork & Client", completed: currentStep !== "artwork" },
    { id: "invoice" as WizardStep, label: "Generate Invoice", completed: !!invoiceUrl },
    { id: "coa" as WizardStep, label: "Generate COA", completed: !!coaUrl },
    { id: "status" as WizardStep, label: "Update Status", completed: false },
    { id: "shipping" as WizardStep, label: "Shipping Info", completed: false },
    { id: "complete" as WizardStep, label: "Complete", completed: false },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return {
    currentStep,
    setCurrentStep,
    isProcessing,
    selectedArtworkId,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientAddress,
    setClientAddress,
    saleDate,
    setSaleDate,
    finalSalePrice,
    setFinalSalePrice,
    shippingCost,
    setShippingCost,
    taxRate,
    setTaxRate,
    carrierName,
    setCarrierName,
    trackingNumber,
    setTrackingNumber,
    shippingDate,
    setShippingDate,
    invoiceNumber,
    invoiceUrl,
    coaUrl,
    artworks,
    handleArtworkChange,
    validateArtworkStep,
    handleGenerateInvoice,
    handleGenerateCOA,
    handleUpdateStatus,
    handleCompleteTransaction,
    handleReset,
    steps,
    progress,
  };
};
