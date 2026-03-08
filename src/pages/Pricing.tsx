import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Başlangıç",
        price: "0",
        description: "Yeni başlayan küçük işletmeler için ideal.",
        features: [
            "Aylık 50 Randevu",
            "Tek Personel Tanımlama",
            "Temel Takvim Görünümü",
            "Müşteri Kayıt Listesi",
            "E-posta Hatırlatıcılar"
        ],
        cta: "Ücretsiz Başla",
        highlight: false
    },
    {
        name: "Profesyonel",
        price: "299",
        description: "Büyümekte olan tüm işletmeler için en popüler seçenek.",
        features: [
            "Sınırsız Randevu",
            "Sınırsız Personel",
            "SMS Hatırlatıcı Entegrasyonu",
            "Detaylı Finansal Raporlar",
            "Gelir/Gider Takibi",
            "Özel Müşteri Notları"
        ],
        cta: "Hemen Başla",
        highlight: true
    },
    {
        name: "Kurumsal",
        price: "Teklif Al",
        description: "Birden fazla şubesi olan zincir işletmeler için.",
        features: [
            "Çoklu Şube Yönetimi",
            "Özel API Erişimi",
            "Beyaz Etiket (White Label) Çözüm",
            "7/24 Öncelikli Destek",
            "Kişiselleştirilmiş Eğitimler"
        ],
        cta: "Bize Ulaşın",
        highlight: false
    }
];

const Pricing = () => {
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
                        Esnek ve Şeffaf <span className="text-primary">Fiyatlandırma</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-16"
                    >
                        İşletmenizin ölçeğine en uygun paketi seçin, profesyonel randevu yönetimine bugün başlayın.
                    </motion.p>
                </section>

                <section className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-8 rounded-3xl border ${plan.highlight ? 'border-primary ring-1 ring-primary' : 'border-border'} flex flex-col`}
                            >
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground text-sm h-10 overflow-hidden">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold">{plan.price === "Teklif Al" ? plan.price : `₺${plan.price}`}</span>
                                    {plan.price !== "Teklif Al" && <span className="text-muted-foreground ml-2">/ aylık</span>}
                                </div>

                                <div className="flex-grow space-y-4 mb-8">
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex items-start gap-3 text-sm">
                                            <Check className="h-5 w-5 text-primary shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button className={`w-full py-3 rounded-xl font-medium transition-all ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg shadow-primary/20' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                                    {plan.cta}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
