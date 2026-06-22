import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Palette, Globe, CreditCard, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center h-16">
            <Link to="/" className="font-serif text-2xl tracking-tight text-foreground">
              Artha
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16 px-6 lg:px-12 snap-start">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            The Operating System for Independent Artists
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Launch your independent professional art gallery in minutes. Showcase your work, sell directly to
            collectors, and own your creative business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Launch Your Independent Gallery
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center justify-center py-20 px-6 lg:px-12 bg-muted/30 snap-start">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-foreground mb-16">
            Everything you need to run your art business
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Your Own URL"
              description="Get a beautiful gallery at artha.co/yourname"
            />
            <FeatureCard
              icon={<Palette className="h-8 w-8" />}
              title="Showcase Work"
              description="Display your portfolio with a professional gallery layout"
            />
            <FeatureCard
              icon={<CreditCard className="h-8 w-8" />}
              title="Direct Payments"
              description="Connect your PayPal, Stripe, or any payment method"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Manage Sales"
              description="Track inquiries, generate invoices, and manage inventory"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex flex-col justify-between pt-32 pb-8 px-6 lg:px-12 snap-start">
        <div className="max-w-3xl mx-auto text-center flex-1 flex flex-col justify-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">Ready to launch your art career?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join independent artists who are taking control of their creative business.
          </p>
          <div className="flex justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Create Your Gallery
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full text-center border-t border-border pt-8 mt-auto">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Artha Artists. All rights reserved.
          </p>
        </footer>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
