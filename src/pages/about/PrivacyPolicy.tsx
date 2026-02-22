import { useEffect } from "react";
import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import AboutSidebar from "../../components/about/AboutSidebar";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Poshplex";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <header className="pr-6 py-16 border-b border-border">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              At Poshplex, your trust means everything to us. When you shop with us, you're not just buying clothes — you're also sharing your information, and we're committed to protecting it.
            </p>
          </header>

          <div className="py-12 space-y-10 text-[15px] max-w-2xl">
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">What We Collect</h2>
              <p className="text-muted-foreground mb-2">When you place an order, we may collect the following details:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Name</li>
                <li>Phone number</li>
                <li>Delivery address</li>
                <li>Email address</li>
                <li>Payment details (only for online or advance payments)</li>
              </ul>
              <p className="text-muted-foreground mt-2">We use this information solely to process your order, arrange delivery, and keep you informed.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>To confirm and deliver your order</li>
                <li>To contact you if there's any issue with delivery</li>
                <li>To share updates, offers, or promotions (only if you've opted in)</li>
              </ul>
              <p className="text-muted-foreground mt-3 font-medium">We do not sell, trade, or rent your personal information to anyone.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Payment Security</h2>
              <p className="text-muted-foreground">
                For advance delivery charges or online payments, we only use secure and trusted payment gateways. Your payment details are encrypted and never stored by us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Third-Party Services</h2>
              <p className="text-muted-foreground">
                To complete your delivery, we may share limited information (such as your name, phone number, and address) with our trusted delivery partners. We never share your data for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Cookies & Website Data</h2>
              <p className="text-muted-foreground">
                Like most websites, we may use cookies to improve your browsing experience, remember your preferences, and analyze site traffic. These cookies do not collect personal information and you can disable them anytime in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Your Privacy, Your Control</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>You can request us to update or delete your stored information at any time.</li>
                <li>If you no longer wish to receive promotional updates, let us know and we'll respect your choice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Policy Updates</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the updated version will take effect immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Contact Us</h2>
              <p className="text-muted-foreground mb-2">If you have questions about how we handle your data, feel free to reach out:</p>
              <div className="text-muted-foreground space-y-1">
                <p>📞 01887362831</p>
                <p>📧 poshplexbd@gmail.com</p>
              </div>
            </section>
          </div>
        </main>
      </div>
      
      <PoshplexFooter />
    </div>
  );
};

export default PrivacyPolicy;
