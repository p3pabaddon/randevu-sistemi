import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Star, ShieldCheck } from "lucide-react";

const pricingPlans = [
    {
        name: "Başlangıç",
        price: "2500",
        description: "Bireysel çalışanlar ve küçük işletmeler için temel çözüm.",
        features: [
            "isletme.randevudunyasi.com Sayfası",
            "Tek Personel Yönetimi",
            "Sınırsız Hizmet ve Kategori",
            "Müşteri Kayıt Sistemi",
            "Online Randevu Alımı",
            "7/24 Teknik Destek"
        ],
        buttonText: "Hemen Başla",
        highlight: false,
        icon: Zap
    },
    {
        name: "Profesyonel",
        price: "3500",
        description: "Ekipler ve WhatsApp otomasyonu ile büyüyen işletmeler.",
        features: [
            "Başlangıç Paketindeki Her Şey",
            "Sınırsız Personel Yönetimi",
            "WhatsApp Cloud API (Otomatik Onay)",
            "WhatsApp İptal Bildirimleri",
            "Personel Prim/Komisyon Takibi",
            "Gelişmiş Raporlama Paneli",
            "Öncelikli Destek Hattı"
        ],
        buttonText: "En Popüler",
        highlight: true,
        icon: Star
    },
    {
        name: "Kurumsal",
        price: "5000",
        description: "Çok şubeli ve yüksek hacimli kurumsal çözümler.",
        features: [
            "Profesyonel Paketindeki Her Şey",
            "Çoklu Şube Yönetimi",
            "Size Özel Domain (CNAME)",
            "API ve Webhook Erişimi",
            "Özel Müşteri Danışmanı",
            "Kurumsal Eğitim Desteği",
            "SLA Garantisi"
        ],
        buttonText: "Hemen Başla",
        highlight: false,
        icon: ShieldCheck
    }
];

const PricingSection = () => {
    return (
        <section id="fiyatlandirma" className="relative py-24 overflow-hidden">
            <div className="container relative mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass inline-flex rounded-2xl p-1 mb-4"
                    >
                        <div className="rounded-xl bg-primary/10 px-6 py-2 text-sm font-medium text-primary">
                            Şeffaf Fiyatlandırma
                        </div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold text-foreground sm:text-5xl"
                    >
                        İşletmenize Uygun <span className="gradient-text">Planı Seçin</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-lg text-muted-foreground mx-auto max-w-2xl"
                    >
                        Gizli ücretler yok. Sadece ihtiyacınız olan özellikler için ödeme yapın.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative group rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${plan.highlight
                                ? "glass border-primary/50 shadow-2xl shadow-primary/20 scale-105 z-10"
                                : "glass border-primary/10 hover:border-primary/30"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold py-1 px-4 rounded-full">
                                    EN ÇOK TERCİH EDİLEN
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-2xl ${plan.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    <plan.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-foreground">
                                        ₺{plan.price}
                                    </span>
                                    <span className="text-muted-foreground text-xs font-medium ml-1">/ Tek Seferlik</span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                                <p className="mt-2 text-[10px] text-muted-foreground opacity-70 italic">
                                    * Sistem kurulumu ve lisans için tek seferlik ücret.
                                    <br />* 6 ayda bir ₺2000 teknik destek ve güncelleme ücreti uygulanır.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                            <Check size={12} />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <a
                                href={`https://api.whatsapp.com/send?phone=905466767595&text=Merhaba,%20${plan.name}%20paketi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold transition-all ${plan.highlight
                                    ? "bg-primary text-primary-foreground shadow-lg hover:shadow-primary/30"
                                    : "bg-muted text-foreground hover:bg-primary/10"
                                    }`}
                            >
                                {plan.buttonText}
                                <ArrowRight size={18} />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
