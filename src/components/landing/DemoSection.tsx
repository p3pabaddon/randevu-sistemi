import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

const DemoSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="demo" ref={ref} className="relative py-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-gradient-bg" />
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-20" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 glass inline-flex rounded-2xl p-1">
            <div className="rounded-xl bg-primary/10 px-6 py-2 text-sm font-medium text-primary">
              Hemen Başlayın
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground sm:text-5xl">
            Sistemimizi işletmenize özel{" "}
            <span className="gradient-text">kuruyoruz</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            RandevuDunyasi ile işletmenizin randevu süreçlerini tamamen otomatik hale getirin.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%20Randevu%20D%C3%BCnyas%C4%B1%20online%20randevu%20sistemi%20%C3%A7%C3%B6z%C3%BCm%C3%BCn%C3%BCz%20hakk%C4%B1nda%20teknik%20bilgi%20ve%20kurumsal%20demo%20sunumu%20rica%20ediyoruz.%20%C4%B0%C5%9Fletme%20verimlili%C4%9Fimizi%20art%C4%B1rmak%20ad%C4%B1na%20taraf%C4%B1n%C4%B1zdan%20geri%20d%C3%B6n%C3%BC%C5%9F%20beklemekteyiz."
              target="_blank"
              rel="noopener noreferrer"
              className="group relative z-[100] flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
            >
              Demo Talep Et
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%20Randevu%20D%C3%BCnyas%C4%B1%20online%20randevu%20sistemi%20%C3%A7%C3%B6z%C3%BCm%C3%BCn%C3%BCz%20hakk%C4%B1nda%20teknik%20bilgi%20ve%20kurumsal%20demo%20sunumu%20rica%20ediyoruz.%20%C4%B0%C5%9Fletme%20verimlili%C4%9Fimizi%20art%C4%B1rmak%20ad%C4%B1na%20taraf%C4%B1n%C4%B1zdan%20geri%20d%C3%B6n%C3%BC%C5%9F%20beklemekteyiz."
              target="_blank"
              rel="noopener noreferrer"
              className="group relative z-[100] flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <MessageCircle className="h-4 w-4" />
              Bize Ulaşın
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
