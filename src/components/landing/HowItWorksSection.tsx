import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Settings, ListPlus, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Settings,
    step: "01",
    title: "İşletmenize özel sistem kurulumu",
    description: "Size özel randevu sayfanızı birkaç dakika içinde oluşturuyoruz.",
  },
  {
    icon: ListPlus,
    step: "02",
    title: "Hizmetlerinizi ve çalışma saatlerinizi ekleyin",
    description: "Sunduğunuz hizmetleri, çalışanlarınızı ve saatlerinizi kolayca tanımlayın.",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Müşterileriniz online randevu oluştursun",
    description: "Müşterileriniz 7/24 size uygun zamanlarda randevu alabilir.",
  },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="nasil-calisir" ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium text-primary">Basit Süreç</span>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            3 adımda <span className="gradient-text">başlayın</span>
          </h2>
        </motion.div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute top-16 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 md:block" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 * i }}
              className="group relative"
            >
              <div className="glass rounded-2xl p-8 text-center transition-all duration-500 hover-glow hover:border-primary/30">
                <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110" />
                  <s.icon className="relative h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary/60">ADIM {s.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
