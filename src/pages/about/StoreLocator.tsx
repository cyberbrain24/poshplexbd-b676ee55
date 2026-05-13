import { useState } from "react";
import { Helmet } from "react-helmet-async";
import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import AboutSidebar from "../../components/about/AboutSidebar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const LOCAL_BUSINESS_LD = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "POSHPLEX",
  image: "https://poshplexbd.com/favicon.ico",
  url: "https://poshplexbd.com/pages/store-locator",
  telephone: "+8801887362831",
  email: "poshplexbd@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dhaka",
    addressCountry: "BD",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "10:00",
      closes: "20:00",
    },
  ],
  priceRange: "৳৳",
};

const StoreLocator = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <header className="pr-6 py-16 border-b border-border">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground mb-3">GET IN TOUCH</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-foreground mb-4">
              Find Us
            </h1>
            <p className="text-muted-foreground">BE POSH WITH POSHPLEX</p>
          </header>

          {/* Contact Info Cards */}
          <section className="py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
            <div className="border border-border p-6 text-center space-y-3">
              <MapPin className="mx-auto text-foreground" size={22} />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Visit Our Office</h3>
              <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
            </div>
            <div className="border border-border p-6 text-center space-y-3">
              <Mail className="mx-auto text-foreground" size={22} />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Mail Us</h3>
              <a href="mailto:poshplexbd@gmail.com" className="text-sm text-muted-foreground block">poshplexbd@gmail.com</a>
            </div>
            <div className="border border-border p-6 text-center space-y-3">
              <Phone className="mx-auto text-foreground" size={22} />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Call Us</h3>
              <a href="tel:+8801887362831" className="text-sm text-muted-foreground block">+88 01887 362831</a>
            </div>
          </section>

          {/* Contact Form */}
          <section className="py-12 border-t border-border mb-8">
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-2 border-b border-border pb-2">Contact Us</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xl">
              Have a question or need assistance? Drop us a message and we'll get back to you as soon as possible.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <Input
                placeholder="Your Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="rounded-none"
              />
              <Input
                type="email"
                placeholder="Your Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                className="rounded-none"
              />
              <Input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={200}
                className="rounded-none"
              />
              <Textarea
                placeholder="Your Message *"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={1000}
                rows={5}
                className="rounded-none resize-none"
              />
              <Button type="submit" disabled={sending} className="rounded-none px-8">
                {sending ? "SENDING..." : "SEND MESSAGE"}
              </Button>
            </form>
          </section>
        </main>
      </div>
      
      <PoshplexFooter />
    </div>
  );
};

export default StoreLocator;
