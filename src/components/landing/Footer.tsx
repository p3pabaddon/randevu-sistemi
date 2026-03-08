import { Calendar } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
            <img src="/logo.png" alt="RandevuDunyasi Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-foreground">STRUCTLY</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">Hakkımızda</a>
          <a href="#" className="transition-colors hover:text-foreground">İletişim</a>
          <a href="#" className="transition-colors hover:text-foreground">Gizlilik Politikası</a>
          <a href="#" className="transition-colors hover:text-foreground">Kullanım Şartları</a>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        © 2025 STRUCTLY. Tüm hakları saklıdır.
      </div>
    </div>
  </footer>
);

export default Footer;
