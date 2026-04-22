import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/format";
import { useGetProducts, useGetDenominations, useCreateOrder } from "@workspace/api-client-react";
import { Gamepad2, Info, Loader2, ArrowRight } from "lucide-react";

const formSchema = z.object({
  gameUserId: z.string().min(1, "User ID diperlukan"),
  gameServerId: z.string().optional(),
  customerName: z.string().min(3, "Nama terlalu pendek"),
  customerEmail: z.string().email("Format email tidak valid"),
  customerPhone: z.string().min(9, "Nomor WhatsApp tidak valid").max(15, "Nomor WhatsApp terlalu panjang"),
});

export default function TopUp() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedDenom, setSelectedDenom] = useState<string | null>(null);

  const { data: products } = useGetProducts();
  const product = products?.find(p => p.gameCode === gameCode);

  const { data: denominations, isLoading: isDenomLoading } = useGetDenominations(gameCode || "", {
    query: { 
      queryKey: ['denominations', gameCode],
      enabled: !!gameCode 
    }
  });

  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameUserId: "",
      gameServerId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  useEffect(() => {
    if (!gameCode) {
      setLocation("/");
    }
  }, [gameCode, setLocation]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedDenom) {
      toast({
        title: "Pilih nominal",
        description: "Silakan pilih nominal top up terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    createOrder.mutate({
      data: {
        gameCode: gameCode!,
        productCode: selectedDenom,
        gameUserId: values.gameUserId,
        gameServerId: values.gameServerId || null,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
      }
    }, {
      onSuccess: (res) => {
        setLocation(`/order/${res.order.orderId}`);
      },
      onError: (err: any) => {
        toast({
          title: "Terjadi kesalahan",
          description: err?.message || "Gagal membuat pesanan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    });
  };

  if (!product && !products) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (products && !product) {
    setLocation("/404");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Game Info - Left Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 bg-card/50 backdrop-blur border-border overflow-hidden">
              <div className="aspect-[4/3] w-full bg-muted relative">
                {product?.imageUrl ? (
                  <img src={product.imageUrl} alt={product.gameName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80" />
              </div>
              <CardContent className="pt-6 relative z-10 -mt-20">
                <Badge variant="outline" className="mb-2 bg-background/80 backdrop-blur text-primary border-primary/30">
                  {product?.category}
                </Badge>
                <h1 className="text-2xl font-bold mb-4">{product?.gameName}</h1>
                <div className="text-sm text-muted-foreground prose prose-invert max-w-none">
                  {product?.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <p>Top up diamond {product?.gameName} resmi, aman, dan instan. Buka 24 jam dengan berbagai metode pembayaran.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forms & Selection - Main Area */}
          <div className="lg:col-span-8 space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. User ID Info */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
                      <CardTitle>Masukkan Data Akun</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gameUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: 12345678" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gameServerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone / Server ID (Opsional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: 1234" className="bg-background" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Biarkan kosong jika game tidak menggunakan Zone ID.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 2. Select Denomination */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">2</div>
                      <CardTitle>Pilih Nominal Top Up</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isDenomLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                      </div>
                    ) : denominations?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
                        Produk sedang tidak tersedia saat ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {denominations?.filter(d => d.isActive).map((denom) => (
                          <div
                            key={denom.productCode}
                            onClick={() => setSelectedDenom(denom.productCode)}
                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 overflow-hidden group ${
                              selectedDenom === denom.productCode 
                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                                : "border-border bg-background hover:border-primary/50 hover:bg-card"
                            }`}
                          >
                            <div className="flex flex-col h-full justify-between gap-2 relative z-10">
                              <span className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                                {denom.productName}
                              </span>
                              <span className="text-primary font-bold">
                                {formatRupiah(denom.sellingPrice)}
                              </span>
                            </div>
                            {selectedDenom === denom.productCode && (
                              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-bl-full -mr-8 -mt-8" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Customer Info */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">3</div>
                      <CardTitle>Data Kontak (Untuk Invoice)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. WhatsApp</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="081234567890" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Checkout Summary Footer */}
                <div className="sticky bottom-0 z-40 bg-card border-t border-x border-border rounded-t-3xl p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] md:rounded-3xl md:static">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-auto">
                      <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                      <p className="text-2xl md:text-3xl font-bold text-primary">
                        {selectedDenom 
                          ? formatRupiah(denominations?.find(d => d.productCode === selectedDenom)?.sellingPrice || 0)
                          : "Rp 0"}
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full md:w-auto px-8 font-bold text-lg h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      disabled={createOrder.isPending || !selectedDenom}
                    >
                      {createOrder.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          Beli Sekarang
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
