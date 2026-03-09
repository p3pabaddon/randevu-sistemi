import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const sectors = [
  { name: "Kuaför & Güzellik", slug: "kuafor-ve-guzellik" },
  { name: "Sağlık & Klinik", slug: "saglik-ve-klinik" },
  { name: "Spor & Fitness", slug: "spor-ve-fitness" },
  { name: "Danışmanlık", slug: "danismanlik" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 overflow-hidden transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="RandevuDunyasi Logo" width="40" height="40" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">RandevuDunyasi</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Ana Sayfa</Link>

          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground font-medium"
            >
              Çözümler <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-56 rounded-xl glass-strong border border-white/10 p-2 shadow-2xl"
                >
                  {sectors.map((s) => (
                    <Link
                      key={s.slug}
                      to={`/sektor/${s.slug}`}
                      className="block px-4 py-3 text-sm text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      {s.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="/#hesaplayici" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Kazanç Hesapla</a>
          <a href="/#referans" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Referans</a>
          <a href="/#ozellikler" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Özellikler</a>
          <a href="/#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">S.S.S.</a>
          <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Blog</Link>
          <a href="/#neden-biz" className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium">Neden Biz</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href="/app" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-all hover:border-primary/50 hover:bg-primary/5">
            Giriş Yap
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%20Randevu%20D%C3%BCnyas%C4%B1%20online%20randevu%20sistemi%20%C3%A7%C3%B6z%C3%BCm%C3%BCn%C3%BCz%20hakk%C4%B1nda%20teknik%20bilgi%20ve%20kurumsal%20demo%20sunumu%20rica%20ediyoruz.%20%C4%B0%C5%9Fletme%20verimlili%C4%9Fimizi%20art%C4%B1rmak%20ad%C4%B1na%20taraf%C4%B1n%C4%B1zdan%20geri%20d%C3%B6n%C3%BC%C5%9F%20beklemekteyiz."
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-[100] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Demo Talep Et
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-2"
          aria-label={mobileOpen ? "Menüyü Kapat" : "Menüyü Aç"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-strong border-t border-border md:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-6 border-b border-white/5">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Ana Sayfa</Link>

            <div className="py-2 border-y border-white/5 space-y-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Çözümlerimiz</span>
              {sectors.map((s) => (
                <Link
                  key={s.slug}
                  to={`/sektor/${s.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>

            <a href="/#hesaplayici" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Kazanç Hesapla</a>
            <a href="/#referans" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Referans</a>
            <a href="/#ozellikler" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Özellikler</a>
            <a href="/#faq" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">S.S.S.</a>
            <Link to="/blog" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Blog</Link>
            <a href="/#neden-biz" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Neden Biz</a>
            <a href="/app" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Giriş Yap</a>
            <a href="https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%20Randevu%20D%C3%BCnyas%C4%B1%20online%20randevu%20sistemi%20%C3%A7%C3%B6z%C3%BCm%C3%BCn%C3%BCz%20hakk%C4%B1nda%20teknik%20bilgi%20ve%20kurumsal%20demo%20sunumu%20rica%20ediyoruz.%20%C4%B0%C5%9Fletme%20verimlili%C4%9Fimizi%20art%C4%B1rmak%20ad%C4%B1na%20taraf%C4%B1n%C4%B1zdan%20geri%20d%C3%B6n%C3%BC%C5%9F%20beklemekteyiz." target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="relative z-[100] rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground">Demo Talep Et</a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
