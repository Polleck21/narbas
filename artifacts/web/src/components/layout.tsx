import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Gamepad2, Search, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/cek-pesanan", label: "Cek Pesanan", icon: Search },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TopUp Zone
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur absolute top-16 left-0 right-0 p-4 flex flex-col gap-4 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Gamepad2 className="w-6 h-6 text-primary" />
                <span className="font-bold text-xl tracking-tight">TopUp Zone</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Platform top-up game tercepat dan terpercaya di Indonesia. Buka 24/7 dengan berbagai pilihan pembayaran yang aman.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Menu Cepat</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
                <li><Link href="/cek-pesanan" className="hover:text-primary transition-colors">Cek Pesanan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Layanan Pelanggan</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Buka 24/7 Setiap Hari</li>
                <li>support@topupzone.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between">
            <p>&copy; {new Date().getFullYear()} TopUp Zone. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="text-xs">Aman & Terpercaya</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
