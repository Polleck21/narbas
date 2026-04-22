import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCheckOrderByReference } from "@workspace/api-client-react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckOrder() {
  const [reference, setReference] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: order, isLoading, isError, error } = useCheckOrderByReference(searchQuery, {
    query: { 
      queryKey: ['checkOrderByReference', searchQuery],
      enabled: !!searchQuery,
      retry: false
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      toast({
        title: "Input kosong",
        description: "Masukkan Nomor Pesanan terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }
    setSearchQuery(reference.trim());
  };

  const handleNavigateToOrder = () => {
    if (order) {
      setLocation(`/order/${order.orderId}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Cek Status Pesanan</h1>
          <p className="text-muted-foreground text-lg">
            Pantau status transaksi top up Anda dengan memasukkan Nomor Pesanan / Invoice.
          </p>
        </div>

        <Card className="bg-card border-border mb-8 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Masukkan Nomor Pesanan (Contoh: ORD-1234567890)"
                  className="pl-10 h-14 bg-background text-lg"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 font-bold text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cari Pesanan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-6 text-center text-destructive">
              <p className="font-semibold">Pesanan tidak ditemukan.</p>
              <p className="text-sm mt-1">Pastikan nomor pesanan yang Anda masukkan benar.</p>
            </CardContent>
          </Card>
        )}

        {order && !isLoading && (
          <Card className="bg-card border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="font-mono font-bold text-foreground bg-secondary px-2 py-1 rounded">{order.orderId}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">{order.productName}</h3>
                <p className="text-muted-foreground">{order.gameName}</p>
                <div className="mt-4 inline-block px-3 py-1 rounded-full text-sm font-semibold bg-background border border-border">
                  Status: <span className="text-primary uppercase ml-1">{order.paymentStatus}</span>
                </div>
              </div>
              <Button onClick={handleNavigateToOrder} size="lg" className="w-full md:w-auto bg-gradient-to-r from-primary to-accent">
                Lihat Detail <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
