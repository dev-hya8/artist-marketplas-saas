import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useTransactionWizard } from "@/hooks/useTransactionWizard";

interface TransactionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransactionWizard({ open, onOpenChange, onSuccess }: TransactionWizardProps) {
  const {
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
  } = useTransactionWizard({
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="fixed inset-y-0 right-0 left-auto h-screen w-full max-w-4xl border-l border-border bg-background rounded-none">
        <DrawerHeader className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-2xl font-bold text-foreground">
                Transaction Wizard
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-1">
                    {step.completed ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <span className={currentStep === step.id ? "text-primary font-semibold" : ""}>
                        {idx + 1}
                      </span>
                    )}
                    <span className={currentStep === step.id ? "text-primary font-semibold" : ""}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-6 flex-1 bg-background">
          <div className="space-y-8 max-w-2xl mx-auto pb-24">
            {/* Step 1: Artwork & Client Info */}
            {currentStep === "artwork" && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="artwork" className="text-base font-semibold text-foreground">
                    Select Artwork *
                  </Label>
                  <Select value={selectedArtworkId} onValueChange={handleArtworkChange}>
                    <SelectTrigger id="artwork" className="h-12 text-base">
                      <SelectValue placeholder="Choose an artwork to sell" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {artworks?.map((artwork) => (
                        <SelectItem key={artwork.id} value={artwork.id} className="text-base py-3">
                          {artwork.title} - {artwork.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-6 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground">Client Details</h3>

                  <div className="space-y-3">
                    <Label htmlFor="clientName" className="text-base font-semibold text-foreground">
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="John Smith"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="clientEmail" className="text-base font-semibold text-foreground">
                      Client Email *
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="clientAddress" className="text-base font-semibold text-foreground">
                      Client Shipping Address *
                    </Label>
                    <Textarea
                      id="clientAddress"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="123 Main Street&#10;Apt 4B&#10;New York, NY 10001"
                      className="min-h-24 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-6 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground">Sale Details</h3>

                  <div className="space-y-3">
                    <Label htmlFor="saleDate" className="text-base font-semibold text-foreground">
                      Sale Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="saleDate"
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal text-base",
                            !saleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={saleDate}
                          onSelect={setSaleDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="finalSalePrice" className="text-base font-semibold text-foreground">
                      Final Sale Price *
                    </Label>
                    <Input
                      id="finalSalePrice"
                      type="number"
                      step="0.01"
                      value={finalSalePrice}
                      onChange={(e) => setFinalSalePrice(e.target.value)}
                      placeholder="5000.00"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="shippingCost" className="text-base font-semibold text-foreground">
                      Shipping Cost
                    </Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder="0.00"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="taxRate" className="text-base font-semibold text-foreground">
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Generate Invoice */}
            {currentStep === "invoice" && (
              <div className="text-center py-12 space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Generate Invoice</h3>
                  <p className="text-muted-foreground">
                    Click below to generate the invoice PDF for this sale.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Generate COA */}
            {currentStep === "coa" && (
              <div className="text-center py-12 space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Generate Certificate of Authenticity</h3>
                  <p className="text-muted-foreground">
                    Create an official COA document for this artwork.
                  </p>
                  {invoiceUrl && (
                    <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View Invoice
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Update Status */}
            {currentStep === "status" && (
              <div className="text-center py-12 space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Update Artwork Status</h3>
                  <p className="text-muted-foreground">
                    Mark this artwork as sold in your inventory.
                  </p>
                  {coaUrl && (
                    <a href={coaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View COA
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Shipping Info */}
            {currentStep === "shipping" && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <h3 className="text-xl font-semibold mb-2">Shipping & Logistics</h3>
                  <p className="text-muted-foreground">
                    Enter the shipping details for this artwork.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="carrierName" className="text-base font-semibold text-foreground">
                    Carrier Name *
                  </Label>
                  <Input
                    id="carrierName"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="FedEx, UPS, DHL, etc."
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="trackingNumber" className="text-base font-semibold text-foreground">
                    Tracking Number *
                  </Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="1234567890"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="shippingDate" className="text-base font-semibold text-foreground">
                    Shipping Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="shippingDate"
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal text-base",
                          !shippingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {shippingDate ? format(shippingDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={shippingDate}
                        onSelect={setShippingDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Step 6: Complete */}
            {currentStep === "complete" && (
              <div className="text-center py-12 space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Transaction Complete!</h3>
                  <p className="text-muted-foreground">
                    All transaction details have been saved successfully.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
          <div className="flex gap-3 max-w-2xl mx-auto w-full">
            {currentStep === "artwork" && (
              <Button
                onClick={() => {
                  if (validateArtworkStep()) {
                    setCurrentStep("invoice");
                  }
                }}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                Next: Generate Invoice
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}

            {currentStep === "invoice" && (
              <Button
                onClick={handleGenerateInvoice}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Invoice PDF
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {currentStep === "coa" && (
              <Button
                onClick={handleGenerateCOA}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate COA
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {currentStep === "status" && (
              <Button
                onClick={handleUpdateStatus}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Mark as Sold
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {currentStep === "shipping" && (
              <Button
                onClick={handleCompleteTransaction}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Transaction"
                )}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}