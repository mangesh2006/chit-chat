import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Showcase } from "@/components/landing/Showcase";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <CTA />
      <Footer />
    </main>
  );
}