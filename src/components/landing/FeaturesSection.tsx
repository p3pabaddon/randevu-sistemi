import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CalendarDays, ShieldCheck, Users, Contact, BarChart3, Smartphone, Gift } from "lucide-react";

const features = [
  { icon: CalendarDays, title: "Akıllı Takvim", desc: "Tüm randevularınızı tek bir takvimde görün ve yönetin." },
  { icon: ShieldCheck, title: "Çakışma Engelleme", desc: "Aynı saatte birden fazla randevu alınmasını otomatik engelleyin." },
  { icon: Users, title: "Çalışan Bazlı Yönetim", desc: "Her çalışanın kendi takvimi ve müsaitlik durumu." },
  { icon: Contact, title: "Müşteri Listesi", desc: "Tüm müşterilerinizi ve randevu geçmişlerini takip edin." },
  { icon: BarChart3, title: "Raporlama Paneli", desc: "Randevu istatistikleri ve doluluk oranlarını analiz edin." },
  { icon: Gift, title: "Hediye & Referans Sistemi", desc: "Arkadaşını getiren işletmelere indirim ve hediye süre kazandırın." },
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="ozellikler" ref={ref} className="relative py-24">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/5 blur-[150px]" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium text-primary">Güçlü Özellikler</span>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            İhtiyacınız olan <span className="gradient-text">her şey</span> tek yerde
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group glass rounded-2xl p-6 transition-all duration-500 hover-glow hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
