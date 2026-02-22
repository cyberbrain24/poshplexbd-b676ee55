import { useEffect } from "react";
import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import AboutSidebar from "../../components/about/AboutSidebar";

const TermsConditions = () => {
  useEffect(() => {
    document.title = "Terms & Conditions - Poshplex";
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
              Terms & Conditions
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome to Poshplex. By placing an order with us, you agree to the following terms and conditions. Please read them carefully before shopping.
            </p>
          </header>

          <div className="py-12 space-y-10 text-[15px] max-w-2xl">
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Orders</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Once you place an order, we'll confirm it via call or text.</li>
                <li>Orders may be cancelled if incorrect details are provided or if the product is unavailable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Pricing & Payment</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>All listed prices are final and include VAT (if applicable).</li>
                <li>
                  Delivery Charges:
                  <ul className="list-none ml-6 mt-1 space-y-1">
                    <li>Inside Dhaka: ৳70</li>
                    <li>Sub-urban areas: ৳100</li>
                    <li>Outside Dhaka: ৳120 (advance delivery charge required; product price can be paid on delivery)</li>
                  </ul>
                </li>
                <li>For Cash on Delivery, please keep the exact amount ready at the time of delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Shipping & Delivery</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Inside Dhaka: 2–3 working days</li>
                <li>Sub-urban areas: 2–4 working days</li>
                <li>Outside Dhaka: 3–4 working days (advance delivery charge required)</li>
                <li>Delivery times may vary due to courier delays, traffic, or weather conditions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Exchanges & Returns</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Exchange requests must be made within 24 hours of delivery.</li>
                <li>Exchanges are only available for defective, damaged, or wrong items.</li>
                <li>Products must be unused, in original condition, and in original packaging.</li>
                <li>Returns are only accepted instantly at the time of delivery, in front of the delivery person.</li>
                <li>Delivery charges must be paid again for exchanges.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Use of Our Content</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>All product photos, designs, and content are the property of Poshplex.</li>
                <li>You may not copy, use, or reproduce them without prior permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Limitation of Liability</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>We are not responsible for delivery delays caused by third-party couriers, traffic, or weather.</li>
                <li>We are not liable for any loss or damage once the product has been delivered and accepted.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update or change these Terms & Conditions at any time. Any updates will be posted on our platforms and take effect immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Contact Us</h2>
              <p className="text-muted-foreground mb-2">For questions or concerns, reach us at:</p>
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

export default TermsConditions;
