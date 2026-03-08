import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CalendarDays, Users, BarChart3, Clock, ChevronRight } from "lucide-react";

const appointments = [
  { time: "09:00", name: "Mehmet K.", service: "Saç Kesimi", status: "onaylandı" },
  { time: "10:30", name: "Zeynep A.", service: "Cilt Bakımı", status: "bekliyor" },
  { time: "11:00", name: "Ali R.", service: "Sakal Tıraşı", status: "onaylandı" },
  { time: "14:00", name: "Fatma S.", service: "Manikür", status: "onaylandı" },
];

const DashboardSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="glass rounded-2xl p-1 glow-md">
              <div className="rounded-xl bg-card p-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: CalendarDays, label: "Bugün", value: "8", color: "text-primary" },
                    { icon: Users, label: "Müşteri", value: "342", color: "text-accent" },
                    { icon: BarChart3, label: "Bu Ay", value: "156", color: "text-green-400" },
                    { icon: Clock, label: "Bekleyen", value: "3", color: "text-yellow-400" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-secondary/50 p-3">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                      <p className="mt-2 text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Appointments list */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Bugünkü Randevular</h3>
                  </div>
                  <div className="space-y-2">
                    {appointments.map(a => (
                      <div key={a.time} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 transition-colors hover:bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-10">{a.time}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.service}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${a.status === "onaylandı" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                          }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="text-sm font-medium text-primary">Güçlü Yönetim Paneli</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              Tüm randevularınız{" "}
              <span className="gradient-text">kontrol altında</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Randevuları onaylayın, müşteri geçmişini görüntüleyin, doluluk oranlarınızı analiz edin.
              Modern ve kullanımı kolay yönetim paneliyle her şey elinizin altında.
            </p>
            <ul className="mt-6 space-y-3">
              {["Randevu listesi ve takvim görünümü", "Müşteri veritabanı", "Gelir ve doluluk analitiği", "Çalışan yönetimi"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
