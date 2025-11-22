import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-light tracking-wide hover:opacity-70 transition-opacity">
            Hya Baliña
          </Link>
          <div className="flex gap-8">
            <Link to="/" className="text-sm font-light tracking-wide hover:opacity-70 transition-opacity">
              Works
            </Link>
            <Link to="/contact" className="text-sm font-light tracking-wide hover:opacity-70 transition-opacity">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
