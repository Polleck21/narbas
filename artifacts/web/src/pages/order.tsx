import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetOrder } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { Copy, CheckCircle2, Clock, XCircle, ArrowRight, Home, RefreshCw, Gamepad2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Need to extend Window to include snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: any) => void;
    };
  }
}

export default function Order() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading, refetch } = useGetOrder(orderId || "", {
    query: { 
      queryKey: ['order', orderId],
      enabled: !!orderId 
    }
  });

  const handlePayment = () => {
    if (!order?.snapToken) {
      toast({
        title: "Error",
        description: "Token pembayaran tidak tersedia",
        variant: "destructive"
      });
      return;
    }

    if (window.snap) {
      window.snap.pay(order.snapToken, {
        onSuccess: function(result: any) {
          toast({ title: "Pembayaran Berhasil", description: "Terima kasih, pesanan Anda sedang diproses." });
          refetch();
        },
        onPending: function(result: any) {
          toast({ title: "Menunggu Pembayaran", description: "Silakan selesaikan pembayaran Anda." });
        },
        onError: function(result: any) {
          toast({ title: "Pembayaran Gagal", description: "Pembayaran gagal diproses.", variant: "destructive" });
          refetch();
        },
        onClose: function() {
          toast({ title: "Pembayaran Dibatalkan", description: "Anda menutup popup pembayaran sebelum menyelesaikannya." });
        }
      });
    } else {
      // Fallback to paymentUrl
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        toast({ title: "Error", description: "Sistem pembayaran belum siap, coba lagi.", variant: "destructive" });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Disalin",
      description: "Berhasil disalin ke clipboard",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-3xl flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Pesanan Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-8">Maaf, kami tidak dapat menemukan data pesanan tersebut.</p>
          <Link href="/">
            <Button><Home className="w-4 h-4 mr-2"/> Kembali ke Beranda</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isPending = order.paymentStatus === "pending";
  const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "settlement";
  const isFailed = order.paymentStatus === "expire" || order.paymentStatus === "cancel" || order.paymentStatus === "deny";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 relative">
            {isPaid ? (
              <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-full" />
            ) : null}
            {isPaid ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
            ) : isFailed ? (
              <XCircle className="w-12 h-12 text-destructive relative z-10" />
            ) : (
              <Clock className="w-12 h-12 text-yellow-500 relative z-10" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isPaid ? "Pembayaran Berhasil" : isFailed ? "Pesanan Dibatalkan" : "Menunggu Pembayaran"}
          </h1>
          <p className="text-muted-foreground">
            {isPaid ? "Terima kasih! Pesanan Anda sedang kami proses." : 
             isFailed ? "Pesanan ini sudah kadaluarsa atau dibatalkan." : 
             "Silakan selesaikan pembayaran untuk melanjutkan pesanan."}
          </p>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-muted px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">ID Pesanan</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-foreground">{order.orderId}</span>
                <button onClick={() => copyToClipboard(order.orderId)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={isPaid ? "default" : isFailed ? "destructive" : "secondary"} 
                className={isPaid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : isPending ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : ""}>
                {order.paymentStatus.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Status Pembayaran</p>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Detail Item</h3>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{order.productName}</p>
                  <p className="text-muted-foreground">{order.gameName}</p>
                </div>
                <p className="font-bold text-xl text-primary">{formatRupiah(order.amount)}</p>
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Detail Akun</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">User ID</p>
                  <p className="font-medium text-foreground">{order.gameUserId}</p>
                </div>
                {order.gameServerId && (
                  <div>
                    <p className="text-muted-foreground mb-1">Server ID</p>
                    <p className="font-medium text-foreground">{order.gameServerId}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Nama Pembeli</p>
                  <p className="font-medium text-foreground">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tanggal Pesanan</p>
                  <p className="font-medium text-foreground">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="h-px w-full bg-border" />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Status Pengiriman (Digiflazz)</h3>
              <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Status Item</span>
                </div>
                <Badge variant="outline" className="capitalize bg-secondary text-secondary-foreground border-border">
                  {order.digiflazzStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted px-6 py-4 flex flex-wrap gap-4 items-center justify-between border-t border-border">
            <Button variant="ghost" onClick={() => refetch()} className="text-muted-foreground">
              <RefreshCw className="w-4 h-4 mr-2" /> Segarkan Status
            </Button>
            
            {isPending && (
              <Button onClick={handlePayment} size="lg" className="bg-gradient-to-r from-primary to-accent font-bold w-full md:w-auto">
                Bayar Sekarang <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {isPaid && (
              <Link href="/">
                <Button variant="default">Top Up Lagi</Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
