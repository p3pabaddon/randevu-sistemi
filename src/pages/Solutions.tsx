import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Scissors, Stethoscope, Dumbbell, Briefcase, Coffee, Sparkles } from "lucide-react";

const industries = [
    {
        icon: Scissors,
        title: "Kuaför & Güzellik",
        description: "Randevuları yönetin, personel primlerini takip edin ve müşterilerinize otomatik hatırlatmalar gönderin."
    },
    {
        icon: Stethoscope,
        title: "Sağlık & Klinik",
        description: "Hasta kayıtlarını düzenli tutun, muayene sürelerini optimize edin ve randevu çakışmalarını sıfıra indirin."
    },
    {
        icon: Dumbbell,
        title: "Spor & Fitness",
        description: "Özel ders ve grup dersi planlamalarını kolayca yapın, üyelik paketlerini entegre edin."
    },
    {
        icon: Briefcase,
        title: "Hukuk & Danışmanlık",
        description: "Müvekkil görüşmelerini profesyonelce planlayın, takvim entegrasyonu ile hiçbir toplantıyı kaçırmayın."
    },
    {
        icon: Coffee,
        title: "Kafe & Restoran",
        description: "Rezervasyon yönetimini dijitalleştirin, masa doluluk oranlarını anlık olarak izleyin."
    },
    {
        icon: Sparkles,
        title: "Diğer Sektörler",
        description: "Hangi sektörde olursanız olun, RandevuDunyasi esnek yapısıyla işinize uyum sağlar."
    }
];

const Solutions = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <section className="container mx-auto px-6 py-12">
                    <div className="max-w-3xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-bold mb-6"
                        >
                            Her Sektör İçin <span className="text-primary">Akıllı Çözümler</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-muted-foreground mb-12"
                        >
                            İşletmenizin ihtiyaçlarına özel olarak tasarlanmış randevu yönetim sistemiyle dijitalleşin, verimliliğinizi artırın.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {industries.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                className="p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-xl transition-all group"
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Solutions;
