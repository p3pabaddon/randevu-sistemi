import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Scissors, Brain, Stethoscope, Dumbbell, Apple, Sparkles } from "lucide-react";

const categories = [
  { icon: Scissors, label: "Güzellik Salonları", count: "120+" },
  { icon: Brain, label: "Psikologlar", count: "85+" },
  { icon: Stethoscope, label: "Klinikler", count: "60+" },
  { icon: Scissors, label: "Berberler", count: "200+" },
  { icon: Apple, label: "Diyetisyenler", count: "45+" },
  { icon: Dumbbell, label: "Spor Salonları", count: "70+" },
];

const SocialProofSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 hero-gradient-bg opacity-50" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Güvenilir Altyapı</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Yüzlerce işletmenin randevu süreçlerini{" "}
            <span className="gradient-text">kolaylaştırıyoruz</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Farklı sektörlerden işletmeler RandevuDunyasi ile müşterilerine modern bir deneyim sunuyor.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group glass rounded-xl p-6 text-center transition-all duration-300 hover-glow hover:border-primary/30 cursor-default"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <cat.icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{cat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{cat.count} işletme</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
