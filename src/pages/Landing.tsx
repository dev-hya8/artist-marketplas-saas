import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Palette, Globe, CreditCard, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-background no-scrollbar">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center h-16">
            <Link 
              to="/" 
              className="font-serif text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
            >
              Artha
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section 
          aria-label="Introduction"
          className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6 lg:px-12 snap-start overflow-hidden"
        >
          {/* Ambient background glows */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-primary/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0" />
          <div className="absolute top-1/4 left-1/3 w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none z-0 dark:block hidden" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground leading-tight animate-fade-in-up">
              The Operating System for Independent Artists
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
              Launch your professional art gallery in minutes.
              <br className="hidden sm:inline" />{" "}
              Showcase your portfolio, sell directly to collectors, and keep 100% of your sales.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-200">
              <Link to="/signup" className="w-full sm:w-auto focus:outline-none">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto group text-base sm:text-lg px-8 py-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/20"
                >
                  Launch Your Independent Gallery
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full sm:w-auto focus:outline-none">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          aria-labelledby="features-heading"
          className="min-h-screen flex items-center justify-center py-20 px-6 lg:px-12 bg-muted/30 snap-start"
        >
          <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
            <h2 
              id="features-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl text-center text-foreground leading-tight"
            >
              Everything you need to run your art business
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <FeatureCard
                icon={<Globe className="h-8 w-8 text-primary" aria-hidden="true" />}
                title="Your Own URL"
                description="Get a beautiful gallery at artha.co/yourname"
              />
              <FeatureCard
                icon={<Palette className="h-8 w-8 text-primary" aria-hidden="true" />}
                title="Showcase Work"
                description="Display your portfolio with a professional gallery layout"
              />
              <FeatureCard
                icon={<CreditCard className="h-8 w-8 text-primary" aria-hidden="true" />}
                title="Direct Payments"
                description="Connect your PayPal, Stripe, or any payment method"
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-primary" aria-hidden="true" />}
                title="Manage Sales"
                description="Track inquiries, generate invoices, and manage inventory"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          aria-labelledby="cta-heading"
          className="min-h-screen flex flex-col justify-between pt-32 pb-8 px-6 lg:px-12 snap-start relative overflow-hidden"
        >
          {/* Subtle bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

          <div className="relative z-10 max-w-3xl mx-auto text-center flex-1 flex flex-col justify-center space-y-8 sm:space-y-10">
            <h2 
              id="cta-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight"
            >
              Ready to launch your art career?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Join independent artists who are taking control of their creative business.
            </p>
            <div className="flex justify-center">
              <Link to="/signup" className="w-full sm:w-auto focus:outline-none">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto group text-base sm:text-lg px-8 py-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/20"
                >
                  Create Your Gallery
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="relative z-10 w-full text-center border-t border-border/60 pt-8 mt-auto">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} Artha Artists. All rights reserved.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-background rounded-xl p-6 sm:p-8 border border-border/60 hover:border-primary/20 hover:shadow-md transition-all duration-300">
      <div className="text-primary mb-5" aria-hidden="true">{icon}</div>
      <h3 className="font-semibold text-lg text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
