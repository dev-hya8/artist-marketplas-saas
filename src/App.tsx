import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArtistSettingsProvider } from "@/contexts/ArtistSettingsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { Suspense, lazy } from 'react';

// Lazy load pages
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const CV = lazy(() => import("./pages/CV"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ArtistSignup = lazy(() => import("./pages/ArtistSignup"));
const MyPurchases = lazy(() => import("./pages/MyPurchases"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const PublicGallery = lazy(() => import("./pages/PublicGallery"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create QueryClient instance
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ArtistSettingsProvider>
      <CurrencyProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <Routes>
                  {/* Static routes first */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/admin" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signup" element={<ArtistSignup />} />
                  <Route path="/history" element={<MyPurchases />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/cv" element={<CV />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/gallery" element={<Home />} />
                  <Route path="/artist" element={<ArtistProfile />} />
                  {/* Dynamic artist handle route - MUST be last before catch-all */}
                  <Route path="/:handle" element={<PublicGallery />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </CurrencyProvider>
    </ArtistSettingsProvider>
  </QueryClientProvider>
);

export default App;
