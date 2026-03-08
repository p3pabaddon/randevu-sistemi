import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Calendar, ArrowRight, User } from "lucide-react";

export const blogPosts = [
    {
        title: "Kuaförler İçin Müşteri Sadakatini Artırmanın 5 Yolu",
        slug: "kuafor-musteri-sadakati",
        excerpt: "Salonunuza gelen müşterilerin daimi olması için uygulayabileceğiniz basit ama etkili stratejiler.",
        content: `Müşteri sadakati, bir kuaför salonunun sürdürülebilir büyümesi için en kritik faktördür. Yeni bir müşteri kazanmak, mevcut müşteriyi tutmaktan 5 kat daha maliyetlidir. İşte salonunuzda sadakati artıracak 5 yöntem:

1. Kişiselleştirilmiş Deneyim Sunun
Müşterilerinizin tercihlerini, kullandıkları ürünleri ve özel günlerini not alın. Randevu Dünyası'nın müşteri notları özelliği ile bir sonraki gelişinde ona "Her zamanki gibi mi?" diye sormak paha biçilemez bir histir.

2. Sadakat Programları Oluşturun
10. kesimde %50 indirim veya 5. randevuda ücretsiz bakım gibi teşvikler, müşterinin sizi tercih etmesi için somut bir neden yaratır.

3. Hatırlatma ve Takip
Randevu sonrası gönderilen "Hizmetimizden memnun kaldınız mı?" mesajı, müşteriye değerli olduğunu hissettirir. Ayrıca randevu hatırlatıcıları, gelmeme oranlarını düşürürken profesyonelliğinizi gösterir.

4. Sosyal Medya Etkileşimi
Yapılan saç tasarımlarını (müşterinin izniyle) paylaşmak ve onları etiketlemek, dijital ortamda bir bağ kurmanızı sağlar.

5. Bekleme Süresini Keyifli Hale Getirin
Randevu sistemi sayesinde bekleme sürelerini minimize etseniz bile, o kısa sürede sunulan kaliteli bir kahve veya güncel dergiler deneyimi tamamlar.`,
        date: "7 Mart 2024",
        author: "Randevu Dünyası Ekibi",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
        category: "Güzellik"
    },
    {
        title: "Online Randevu Sistemlerinin İşletme Verimliliğine Etkisi",
        slug: "randevu-sistemi-verimlilik",
        excerpt: "Dijitalleşen dünyada telefon trafiğinden kurtulup işinize odaklanmanın yollarını keşfedin.",
        content: `Günümüzde zaman, en değerli sermayedir. Manuel randevu takibi, sadece zamanınızı değil, aynı zamanda potansiyel müşterilerinizi de kaybetmenize neden olabilir.

Neden Online Randevu?
- 7/24 Erişilebilirlik: Müşterilerinizin %40'ı mesai saatleri dışında randevu almak ister. Siz uyurken randevu defteriniz dolsun.
- Telefon Trafiğine Son: Kesintisiz çalışma imkanı sağlar. Müşterinin saçını keserken veya seans ortasında telefon açmak zorunda kalmazsınız.
- İstatistik ve Raporlama: Ay sonunda hangi hizmetin daha çok kazandırdığını, hangi personelin daha yoğun olduğunu tek tıkla görün.

Dijitalleşme bir seçenek değil, artık bir zorunluluktur. Randevu Dünyası ile bu geçişi saniyeler içinde yapabilirsiniz.`,
        date: "6 Mart 2024",
        author: "Teknoloji Editörü",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        category: "Yönetim"
    },
    {
        title: "No-Show (Gelmeyen Müşteri) Oranını %50 Azaltma Stratejileri",
        slug: "no-show-azaltma",
        excerpt: "Rezervasyon yapıp gelmeyen müşteriler cironuzu düşürür. İşte bu kaybı önlemenin kesin çözümleri.",
        content: `Birçok işletme için en büyük gizli gider, "gelmeyen müşterilerdir". Boş kalan koltuk, ödenen kira ve personel maliyeti demektir.

Nasıl Önlenir?
1. Otomatik WhatsApp Hatırlatmaları: Randevudan 2 saat önce veya 1 gün önce gönderilen otomatik bir mesaj, unutma payını sıfıra indirir.
2. Depozito Sistemi: Özellikle yüksek maliyetli işlemler için küçük bir ön ödeme almak, bağlılığı %90 artırır.
3. Kara Liste Yönetimi: Sürekli randevusuna gelmeyen müşterileri sistemde işaretleyerek önlem alabilirsiniz.
4. Yedek Liste (Waitlist): Biri iptal ettiğinde, bekleyen diğer müşterilere anında haber vererek boşluğu hemen doldurun.

Bu stratejilerle ay sonunda kasanızda ciddi bir fark göreceksiniz.`,
        date: "5 Mart 2024",
        author: "İş Geliştirme Uzmanı",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
        category: "Strateji"
    },
    {
        title: "Klinikler İçin Dijital Dönüşüm Rehberi 2024",
        slug: "klinik-dijital-donusum",
        excerpt: "Sağlık sektöründe teknoloji kullanımı artık bir prestij ve güven göstergesi haline geldi.",
        content: `Klinikler, hasta deneyimini en üst seviyede tutmak zorundadır. Dijital bir altyapı, hem personelin iş yükünü hafifletir hem de hastalara güven verir.

Rehberimizdeki Kritik Adımlar:
- Hasta Kayıtlarının Dijitalleşmesi: Geçmiş seansları ve notları bulmak saniyeler sürsün.
- KVKK Uyumluluğu: Verilerin güvenli ve yasalara uygun saklanması önceliğiniz olmalı.
- Online Takvim: Hastalar müsaitlik durumunuzu görüp kendilerine uygun saati seçebilmeli.
- SMS Entegrasyonu: Yaşça büyük hastalar için SMS, gençler için WhatsApp hatırlatmaları hayat kurtarır.

2024'te teknolojiyi kullanan klinikler, rakiplerinden her zaman bir adım öndedir.`,
        date: "4 Mart 2024",
        author: "Sağlık Yazarı",
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
        category: "Sağlık"
    },
    {
        title: "Küçük İşletmeler İçin Zaman Yönetimi İpuçları",
        slug: "zaman-yonetimi-ipuclari",
        excerpt: "Gününüzü daha verimli planlayarak kendinize ve sevdiklerinize daha fazla vakit ayırın.",
        content: `Küçük işletme sahipleri genellikle her işe yetişmeye çalışırken tükenmişlik yaşarlar. Ancak doğru planlama ile bu döngü kırılabilir.

Etkili Zaman Yönetimi İçin:
- Görevleri Önceliklendirin: "Acil ve Önemli" olanları sabah ilk iş halledin.
- Otomasyona Geçin: Tekrarlayan işleri (randevu verme, teyit alma) yazılımlara bırakın.
- Delegate (Devretme) Edin: Her işi sizin yapmanız gerekmez, ekibinize güvenin.
- Blok Zamanlar Oluşturun: Günün belli saatlerini sadece planlama veya dinlenme için ayırın.

Randevu Dünyası'nın sağladığı raporlar ile gününüzün nerede "boşa" gittiğini analiz edebilir ve rotanızı düzeltebilirsiniz.`,
        date: "3 Mart 2024",
        author: "Verimlilik Koçu",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
        category: "Kişisel Gelişim"
    }
];

const BlogPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            Bilgi <span className="gradient-text">Merkezi</span> {"BLOG_ALARM_123"}
                        </motion.h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            İşletmenizi büyütmeniz için gereken stratejiler, sektörel ipuçları ve teknolojik yenilikler burada.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.map((post, index) => (
                            <motion.article
                                key={post.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group glass rounded-3xl overflow-hidden hover:border-primary/30 transition-all flex flex-col"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {post.author}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className="mt-auto inline-flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all"
                                    >
                                        Devamını Oku <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPage;
