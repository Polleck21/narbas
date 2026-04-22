import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="text-9xl font-extrabold text-muted-foreground/20 mb-4 select-none">404</div>
        <h1 className="text-4xl font-bold mb-4">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Maaf, halaman yang Anda cari mungkin telah dihapus, namanya diubah, atau sementara tidak tersedia.
        </p>
        <Link href="/">
          <Button size="lg" className="font-bold">
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
