import { motion } from "framer-motion";
import { useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DemoSection from "@/components/landing/DemoSection";
import { Scissors, Stethoscope, Dumbbell, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const sectorData: Record<string, any> = {
    "kuafor-ve-guzellik": {
        title: "Kuaför & Güzellik Salonu Randevu Sistemi",
        subtitle: "Salonunuzu dijitalleştirin, müşteri sadakatini artırın.",
        description: "Kuaför ve güzellik merkezlerine özel online randevu, stok yönetimi ve otomatik hatırlatma sistemi. Koltuk verimliliğinizi %40 artırın.",
        icon: Scissors,
        color: "pink",
        features: [
            "7/24 Online Randevu Alma",
            "Personel Bazlı Takvim Yönetimi",
            "WhatsApp Onay ve Hatırlatmalar",
            "Gelişmiş Müşteri Geçmişi ve Kayıt",
            "Hizmet ve Stok Takip Modülü"
        ],
        seoTitle: "En İyi Kuaför Randevu Sistemi | Randevu Dünyası",
        seoDesc: "Kuaför ve güzellik salonları için profesyonel randevu yazılımı. Hemen deneyin, işletmenizi büyütün."
    },
    "saglik-ve-klinik": {
        title: "Sağlık & Klinik İçin Randevu Yönetimi",
        subtitle: "Hasta takibini kolaylaştırın, kliniğinizi profesyonelce yönetin.",
        description: "Özel klinikler, diş hekimleri ve doktorlar için tasarlanmış hasta randu sistemi. Otomatik SMS/WhatsApp hatırlatıcıları ile randevu kaçırmalarına son verin.",
        icon: Stethoscope,
        color: "blue",
        features: [
            "Hasta Kayıt ve Takip Sistemi",
            "Kayıp Randevuları Azaltan Hatırlatıcılar",
            "İleri Tarihli Planlama ve Bloklama",
            "KVKK Uyumlu Güvenli Veri Saklama",
            "Doktor/Uzman Program Yönetimi"
        ],
        seoTitle: "Klinik & Doktor Randevu Sistemi | Hasta Takip Yazılımı",
        seoDesc: "Klinikler için dijital dönüşüm vakti. Hasta yönetimini ve randevuları tek noktadan kontrol edin."
    },
    "spor-ve-fitness": {
        title: "Spor Salonu & Fitness Randevu Yazılımı",
        subtitle: "Ders kapasitelerini yönetin, üyelerinize kolaylık sağlayın.",
        description: "Personal training, yoga ve fitness salonları için özel ders/seans randevu sistemi. Kapasite kontrolü ve üye takibi ile karmaşaya son verin.",
        icon: Dumbbell,
        color: "green",
        features: [
            "Grup Dersi ve PT Seans Yönetimi",
            "Kapasite Bazlı Otomatik Kayıt",
            "Üye Devam ve Paket Takibi",
            "Mobil Uyumlu Kullanıcı Arayüzü",
            "Antrenör Çalışma Saatleri Planlaması"
        ],
        seoTitle: "Spor Salonu & PT Randevu Sistemi | Fitness Yazılımı",
        seoDesc: "Fitness salonları ve kişisel antrenörler için en iyi randevu uygulaması. Üye memnuniyetini artırın."
    },
    "danismanlik": {
        title: "Danışmanlık & Psikolog Randevu Sistemi",
        subtitle: "Zamanınızı verimli planlayın, seanslarınıza odaklanın.",
        description: "Psikologlar, avukatlar ve serbest çalışan danışmanlar için özel takvim ve seans yönetim aracı. Online ödeme ve hatırlatma entegrasyonu ile zaman kazanın.",
        icon: Briefcase,
        color: "purple",
        features: [
            "Bireysel Seans Planlama",
            "Online Görüşme Entegrasyonu",
            "Sean Öncesi Otomatik Bildirim",
            "Gelir ve Ödeme Takip Raporları",
            "Kişiye Özel Randevu Sayfası"
        ],
        seoTitle: "Psikolog & Danışman Randevu Sistemi | Seans Takip",
        seoDesc: "Danışmanlık merkezleri ve psikologlar için online randevu çözümü. Profesyonel takvim yönetimi."
    }
};

const SectorPage = () => {
    const { slug } = useParams();
    const data = slug ? sectorData[slug] : null;

    useEffect(() => {
        if (data) {
            document.title = data.seoTitle;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute("content", data.seoDesc);

            // Dynamic Schema Injection
            const scriptId = "sector-schema";
            let script = document.getElementById(scriptId) as HTMLScriptElement;
            if (!script) {
                script = document.createElement("script");
                script.id = scriptId;
                script.type = "application/ld+json";
                document.head.appendChild(script);
            }

            script.innerHTML = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                "name": data.title,
                "description": data.description,
                "provider": {
                    "@type": "Organization",
                    "name": "Randevu Dünyası"
                },
                "areaServed": {
                    "@type": "Country",
                    "name": "Turkey"
                }
            });

            window.scrollTo(0, 0);
        }
    }, [data, slug]);

    if (!data) return <Navigate to="/404" replace />;

    const Icon = data.icon;

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <a href="/#sectors" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" /> Tüm Sektörler
                        </a>

                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            <div className="lg:w-2/3">
                                <div className={`w-16 h-16 rounded-2xl bg-${data.color}-500/10 text-${data.color}-500 flex items-center justify-center mb-6`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                                    {data.title}
                                </h1>
                                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                                    {data.description}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                    {data.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-5 h-5 text-${data.color}-500`} />
                                            <span className="text-foreground/90 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/3 w-full sticky top-32">
                                <div className="glass p-8 rounded-3xl border-primary/20 bg-primary/5">
                                    <h3 className="text-2xl font-bold mb-4">Hemen Başlayın</h3>
                                    <p className="text-muted-foreground mb-6">
                                        İşletmenize özel kurulum ve teknik detaylar için hemen ücretsiz bir demo talep edin.
                                    </p>
                                    <a
                                        href={`https://api.whatsapp.com/send?phone=905466767595&text=Merhaba, ${data.title} çözümünüz hakkında teknik bilgi ve kurumsal demo sunumu rica ediyoruz.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all hover:shadow-lg"
                                    >
                                        Ücretsiz Demo Talep Et
                                    </a>
                                    <p className="text-xs text-center mt-4 text-muted-foreground">
                                        *Kurulum genellikle aynı gün içinde tamamlanır.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="mt-24">
                        <h2 className="text-3xl font-bold mb-12 text-center text-foreground">
                            Neden <span className="gradient-text">Bizi Tercih Etmelisiniz?</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="glass-light p-8 rounded-2xl">
                                <h4 className="text-lg font-bold mb-2">Sektörel Uzmanlık</h4>
                                <p className="text-sm text-muted-foreground font-medium">Sektörünüzün dinamiklerine göre optimize edilmiş özellikler.</p>
                            </div>
                            <div className="glass-light p-8 rounded-2xl">
                                <h4 className="text-lg font-bold mb-2">Hızlı Kurulum</h4>
                                <p className="text-sm text-muted-foreground font-medium">Dakikalar içinde sisteme geçiş yapabilir, randevu almaya başlayabilirsiniz.</p>
                            </div>
                            <div className="glass-light p-8 rounded-2xl">
                                <h4 className="text-lg font-bold mb-2">7/24 Teknik Destek</h4>
                                <p className="text-sm text-muted-foreground font-medium">Sorunlarınızda her an yanınızdayız, işinizin sürekliliğini sağlıyoruz.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <DemoSection />
            <Footer />
        </div>
    );
};

export default SectorPage;
