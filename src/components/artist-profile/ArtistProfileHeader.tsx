import { cn } from "@/lib/utils";

interface ArtistProfileHeaderProps {
  artistName: string;
  activeSection: "works" | "about" | "contact";
  onSectionChange: (section: "works" | "about" | "contact") => void;
  onContactClick: () => void;
}

export function ArtistProfileHeader({
  artistName,
  activeSection,
  onSectionChange,
  onContactClick,
}: ArtistProfileHeaderProps) {
  const navItems = [
    { id: "works" as const, label: "Available Works" },
    { id: "about" as const, label: "About" },
    { id: "contact" as const, label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Artist Name - Elegant Serif */}
          <button 
            onClick={() => onSectionChange("works")}
            className="font-serif text-3xl tracking-tight text-neutral-900 hover:text-neutral-700 transition-colors"
          >
            {artistName}
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "contact") {
                    onContactClick();
                  } else {
                    onSectionChange(item.id);
                  }
                }}
                className={cn(
                  "text-sm tracking-wide uppercase transition-colors",
                  activeSection === item.id
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
