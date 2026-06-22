import { Link } from "react-router-dom";

export function ArtistProfileFooter() {
  return (
    <footer className="py-12 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        <Link 
          to="/"
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors tracking-wide"
        >
          Powered by Artha Artists
        </Link>
      </div>
    </footer>
  );
}
