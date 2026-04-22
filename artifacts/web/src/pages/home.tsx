import { useGetProducts, useGetTransactionStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { Zap, ShieldCheck, Clock, TrendingUp } from "lucide-react";

export default function Home() {
  const { data: products, isLoading: isProductsLoading } = useGetProducts();
  const { data: stats, isLoading: isStatsLoading } = useGetTransactionStats();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            Top Up Game <br className="md:hidden" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Cepat & Terpercaya
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Tingkatkan pengalaman gaming Anda. Proses instan, harga kompetitif, dan layanan pelanggan 24/7 untuk berbagai game populer.
          </motion.p>
          
          {/* Stats */}
          {!isStatsLoading && stats && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 md:gap-8 mt-12"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 px-6 py-4 rounded-2xl flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{stats.successOrders.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">Transaksi Sukses</span>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 px-6 py-4 rounded-2xl flex flex-col items-center">
                <span className="text-2xl font-bold text-accent">24/7</span>
                <span className="text-sm text-muted-foreground">Layanan Aktif</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Popular Games (Stats) */}
      {!isStatsLoading && stats?.popularGames && stats.popularGames.length > 0 && (
        <section className="py-8 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-accent w-6 h-6" />
              <h2 className="text-xl font-bold">Lagi Tren Sekarang</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {stats.popularGames.map((game) => (
                <div key={game.gameCode} className="snap-start shrink-0 flex items-center gap-3 bg-background border border-border px-4 py-2 rounded-full">
                  <span className="font-semibold text-sm">{game.gameName}</span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">{game.orderCount} Order</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Games Grid */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Pilih Game Anda</h2>
            <p className="text-muted-foreground">Temukan berbagai game populer dengan harga terbaik.</p>
          </div>
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted/20 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          >
            {products?.map((product) => (
              <motion.div key={product.id} variants={item}>
                <Link href={`/topup/${product.gameCode}`}>
                  <Card className="group overflow-hidden bg-card/40 hover:bg-card/80 border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.gameName} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <span className="text-4xl font-bold text-muted-foreground/30">
                            {product.gameName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between z-10 -mt-10 bg-gradient-to-t from-card via-card to-transparent pt-12">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur border-primary/30 text-primary text-[10px]">
                          {product.category}
                        </Badge>
                        <h3 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {product.gameName}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Kami berkomitmen memberikan layanan terbaik untuk kenyamanan gaming Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background/50 border border-border p-8 rounded-3xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Proses Instan</h3>
              <p className="text-muted-foreground text-sm">Top up otomatis masuk dalam hitungan detik setelah pembayaran dikonfirmasi.</p>
            </div>
            
            <div className="bg-background/50 border border-border p-8 rounded-3xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Pembayaran Aman</h3>
              <p className="text-muted-foreground text-sm">Didukung oleh Midtrans dengan berbagai metode pembayaran yang terjamin keamanannya.</p>
            </div>
            
            <div className="bg-background/50 border border-border p-8 rounded-3xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Layanan 24/7</h3>
              <p className="text-muted-foreground text-sm">Sistem kami online 24 jam setiap hari, siap melayani kebutuhan gaming Anda kapanpun.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
