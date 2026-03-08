import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BookingPreviewSection from "@/components/landing/BookingPreviewSection";
import DashboardSection from "@/components/landing/DashboardSection";
import WhyChooseUsSection from "@/components/landing/WhyChooseUsSection";
import DemoSection from "@/components/landing/DemoSection";
import SectorsSection from "@/components/landing/SectorsSection";
import FAQSection from "@/components/landing/FAQSection";
import ROICalculator from "@/components/landing/ROICalculator";
import ReferralSection from "@/components/landing/ReferralSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import AIAssistant from "@/components/landing/AIAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <SocialProofSection />
        <SectorsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <BookingPreviewSection />
        <DashboardSection />
        <WhyChooseUsSection />
        <PricingSection />
        <ROICalculator />
        <ReferralSection />
        <FAQSection />
        <DemoSection />
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Index;
