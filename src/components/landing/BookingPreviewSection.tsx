import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30"];

const BookingPreviewSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [selectedDay, setSelectedDay] = useState(14);
  const [showNotification, setShowNotification] = useState(false);

  const handleConfirm = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 hero-gradient-bg opacity-30" />
      <div className="container relative mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="text-sm font-medium text-primary">Müşteri Deneyimi</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              Müşterilerinizin gördüğü{" "}
              <span className="gradient-text">modern randevu sayfası</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Müşterileriniz size özel randevu sayfanızdan kolayca tarih ve saat seçerek
              randevu oluşturabilir. Hızlı, modern ve mobil uyumlu.
            </p>
          </motion.div>

          {/* Booking preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Mock Notification */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={showNotification ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-none absolute -top-12 left-1/2 z-50 flex w-full max-w-[280px] -translate-x-1/2 items-center gap-3 rounded-xl bg-card/90 px-4 py-3 shadow-2xl backdrop-blur-md border border-primary/20"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Randevu Talebi Alındı</p>
                <p className="text-[10px] text-muted-foreground">Onay bildirimi SMS ile iletilecektir.</p>
              </div>
            </motion.div>

            <div className="glass rounded-2xl p-1 glow-md">
              <div className="rounded-xl bg-card p-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">EG</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Elite Güzellik Salonu</p>
                    <p className="text-xs text-muted-foreground">Saç Kesimi & Fön · 45 dk</p>
                  </div>
                </div>

                {/* Calendar */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Mart 2025</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
                      <div key={d} className="py-1 text-center text-xs text-muted-foreground">{d}</div>
                    ))}
                    {Array.from({ length: 21 }, (_, i) => {
                      const day = i + 10;
                      const isSelected = day === selectedDay;
                      const hasSlots = [10, 12, 14, 16, 18, 20].includes(day);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDay(day)}
                          className={`rounded-md py-1.5 text-center text-xs transition-all ${isSelected
                              ? "bg-primary text-primary-foreground font-bold scale-105"
                              : hasSlots
                                ? "text-foreground hover:bg-primary/10 cursor-pointer"
                                : "text-muted-foreground/40"
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Müsait Saatler</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {timeSlots.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`rounded-lg py-2 text-xs font-medium transition-all ${t === selectedTime
                            ? "bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/20"
                            : "bg-secondary/50 text-foreground hover:bg-primary/10"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm */}
                <button
                  onClick={handleConfirm}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Randevuyu Onayla
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookingPreviewSection;
