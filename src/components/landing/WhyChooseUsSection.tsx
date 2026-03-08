import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PhoneOff, ShieldCheck, Award, Zap } from "lucide-react";

const points = [
  { icon: PhoneOff, title: "Telefon trafiğini azaltır", desc: "Müşteriler online randevu alır, telefonla uğraşmaya son." },
  { icon: ShieldCheck, title: "Randevu çakışmalarını engeller", desc: "Akıllı takvim sistemi çakışmaları otomatik önler." },
  { icon: Award, title: "Profesyonel görünüm sağlar", desc: "Markanıza yakışır modern bir randevu sayfası." },
  { icon: Zap, title: "İşletmenizi dijitalleştirir", desc: "Kağıt ve ajandadan kurtulun, dijital dönüşümü başlatın." },
];

const WhyChooseUsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="neden-biz" ref={ref} className="relative py-24">
      <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-accent/5 blur-[150px]" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium text-primary">Avantajlar</span>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Neden <span className="gradient-text">RandevuDunyasi</span>?
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="group glass rounded-2xl p-8 transition-all duration-500 hover-glow hover:border-primary/30"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <p.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
