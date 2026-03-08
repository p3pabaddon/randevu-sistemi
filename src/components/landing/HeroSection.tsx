import { motion } from "framer-motion";
import { ArrowRight, Play, Calendar, Clock, CheckCircle2, Users, TrendingUp } from "lucide-react";

const FloatingCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    className={className}
  >
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 hero-gradient-bg">
      {/* Dot pattern overlay */}
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-accent/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="container relative mx-auto px-6">
        <div className="flex flex-col items-center pt-16 lg:pt-24">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 glass rounded-full px-5 py-2 text-sm text-muted-foreground"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            İşletmeniz için modern randevu altyapısı
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-4xl text-center text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-7xl"
          >
            STRUCTLY: İşletmeniz İçin{" "}
            <span className="gradient-text">Yeni Nesil</span>{" "}
            Online Randevu Sistemi
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl text-center text-lg text-muted-foreground sm:text-xl"
          >
            Müşterileriniz 7/24 randevu alsın. Siz tüm süreci tek panelden yönetin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%2014%20g%C3%BCnl%C3%BCk%20%C3%BCcretsiz%20deneme%20s%C3%BCrecini%20ba%C5%9Flatmak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="group relative z-[100] flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
              >
                14 Gün Ücretsiz Dene
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#hesaplayici"
                className="group flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <TrendingUp className="h-4 w-4" />
                Kazancını Hesapla
              </a>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Kredi kartı gerekmez • İptal kolaylığı
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <div className="relative mt-20 w-full max-w-5xl">
            {/* Main dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="glass rounded-2xl p-1 glow-md"
            >
              <div className="rounded-xl bg-card p-6">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="glass rounded-lg px-4 py-1.5 text-xs text-muted-foreground">
                    panel.structly.com
                  </div>
                  <div className="w-16" />
                </div>

                {/* Dashboard content */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Bugünkü Randevular</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">12</p>
                    <div className="mt-2 h-1 w-3/4 rounded-full bg-primary/30">
                      <div className="h-1 w-2/3 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Bu Haftaki Müşteri</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">84</p>
                    <div className="mt-2 h-1 w-3/4 rounded-full bg-accent/30">
                      <div className="h-1 w-4/5 rounded-full bg-accent" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Doluluk Oranı</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">%91</p>
                    <div className="mt-2 h-1 w-3/4 rounded-full bg-green-500/30">
                      <div className="h-1 w-[91%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>

                {/* Calendar preview */}
                <div className="mt-4 grid grid-cols-7 gap-1">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
                    <div key={d} className="py-2 text-center text-xs text-muted-foreground">{d}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className={`rounded-md py-2 text-center text-xs transition-colors ${[4, 7, 12, 15, 19, 22].includes(i)
                        ? "bg-primary/20 text-primary font-medium"
                        : i === 10
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:bg-secondary"
                        }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard className="absolute -left-4 top-1/4 hidden lg:block" delay={0.8}>
              <div className="glass rounded-xl p-4 glow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Randevu Onaylandı</p>
                    <p className="text-xs text-muted-foreground">14:30 - Saç Kesimi</p>
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="absolute -right-4 top-1/3 hidden lg:block" delay={1.2}>
              <div className="glass rounded-xl p-4 glow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Yeni Müşteri</p>
                    <p className="text-xs text-muted-foreground">Ayşe Y. kayıt oldu</p>
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="absolute -right-2 bottom-1/4 hidden lg:block" delay={1.6}>
              <div className="glass rounded-xl p-4 glow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Hatırlatma</p>
                    <p className="text-xs text-muted-foreground">3 randevu yaklaşıyor</p>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
