import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Calendar, Bell, LineChart, Users, Smartphone, ShieldCheck } from "lucide-react";

const features = [
    {
        icon: Calendar,
        title: "Akıllı Takvim Yönetimi",
        description: "Sürükle-bırak özelliğiyle randevuları anında güncelleyin. Çakışma önleyici algoritma ile hataları sıfıra indirin."
    },
    {
        icon: Bell,
        title: "Otomatik Hatırlatıcılar",
        description: "Randevudan önce müşterilerinize SMS ve E-posta göndererek gelmeme oranlarını %40'a kadar düşürün."
    },
    {
        icon: LineChart,
        title: "Gelişmiş Raporlama",
        description: "Kazancınızı, personel performansınızı ve en çok tercih edilen hizmetlerinizi detaylı grafiklerle izleyin."
    },
    {
        icon: Users,
        title: "Müşteri Veritabanı (CRM)",
        description: "Müşteri geçmişlerini, tercihlerini ve özel notlarını saklayın. Kişiselleştirilmiş hizmet sunun."
    },
    {
        icon: Smartphone,
        title: "Mobil Uyumlu Panel",
        description: "İşletmenizi telefonunuzdan yönetin. Ek kurulum gerektirmeyen, her cihazdan erişilebilir bulut altyapı."
    },
    {
        icon: ShieldCheck,
        title: "Veri Güvenliği",
        description: "En üst düzey şifreleme yöntemleriyle hem sizin hem de müşterilerinizin verilerini güvenle saklarız."
    }
];

const Features = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <section className="container mx-auto px-6 py-12 text-center max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Sınır Tanımayan <span className="text-primary">Özellikler</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-16"
                    >
                        RandevuDunyasi sadece bir takvim değil, işletmenizi büyütmek için tasarlanmış tam kapsamlı bir yönetim aracıdır.
                    </motion.p>
                </section>

                <section className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="h-16 w-16 border border-border rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-primary/5">
                                    <feature.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
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

export default Features;
