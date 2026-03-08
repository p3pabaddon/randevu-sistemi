import "../../pricing.css";
import { Check } from "lucide-react";

const pricingPlans = [
    {
        name: "Standart",
        price: "5000",
        description: "Küçük işletmeler için ideal başlangıç seviyesi çözüm.",
        features: [
            "Online Randevu Yönetimi",
            "Müşteri Kayıt Sistemi",
            "Sınırsız Hizmet Ekleme",
            "SMS Bildirim Desteği",
            "7/24 Teknik Destek",
            "Temel İstatistikler"
        ],
        highlight: false,
        buttonText: "Hemen Başla"
    },
    {
        name: "Profesyonel",
        price: "8500",
        description: "Büyüyen ekipler için WhatsApp entegrasyonlu paket.",
        features: [
            "Standart Paketteki Tüm Özellikler",
            "WhatsApp Cloud API Entegrasyonu",
            "Otomatik Randevu Onayı",
            "Personel Yönetimi & Takibi",
            "Gelişmiş Raporlama Paneli",
            "Öncelikli Destek Hattı"
        ],
        highlight: true,
        buttonText: "En Çok Tercih Edilen"
    },
    {
        name: "Kurumsal",
        price: "12500",
        description: "Çok şubeli ve yüksek hacimli işletmeler için tam çözüm.",
        features: [
            "Profesyonel Paketteki Tüm Özellikler",
            "Çoklu Şube Yönetimi",
            "Size Özel Domain (CNAME)",
            "API & Webhook Erişimi",
            "Özel Müşteri Danışmanı",
            "Kurumsal Eğitim Desteği"
        ],
        highlight: false,
        buttonText: "Bizimle İletişime Geçin"
    }
];

const PricingSection = () => {
    return (
        <section id="fiyatlandirma" className="pricing-container">
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '15px', color: 'white' }}>
                    İşletmenize Uygun <span style={{ color: '#2563eb' }}>Planı Seçin</span>
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto' }}>
                    Şeffaf fiyatlandırma, gizli maliyet yok. Sadece ihtiyacınız olan özellikler için ödeme yapın.
                </p>
            </div>

            <div className="pricing-grid">
                {pricingPlans.map((plan) => (
                    <div key={plan.name} className={`pricing-card ${plan.highlight ? 'featured' : ''}`}>
                        {plan.highlight && <div className="badge">En Çok Tercih Edilen</div>}

                        <div>
                            <h3 className="card-title">{plan.name}</h3>
                            <div className="price-box">
                                <div className="flex items-baseline">
                                    <span className="currency">₺</span>
                                    <span className="price">{plan.price}</span>
                                    <span className="period">/ Tek Sefer</span>
                                </div>
                                <div className="maintenance-info">
                                    6 ayda bir <strong>2500 TL</strong> bakım ve güncelleme ücreti uygulanır.
                                </div>
                            </div>
                            <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '20px' }}>{plan.description}</p>

                            <ul className="feature-list">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="feature-item">
                                        <Check className="feature-icon" size={18} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <a
                            href="https://api.whatsapp.com/send?phone=905466767595"
                            target="_blank"
                            className={`pricing-btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {plan.buttonText}
                        </a>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PricingSection;
