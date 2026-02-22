import { useEffect } from "react";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";

const ShippingDelivery = () => {
  useEffect(() => {
    document.title = "Shipping & Delivery - Poshplex";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <main className="pt-6">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight uppercase text-foreground mb-2">
            Shipping & Delivery
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            At Poshplex, we believe in clear, hassle-free delivery. No hidden talk — here's everything you need to know about how your orders reach you:
          </p>

          <div className="space-y-10 text-[15px]">
            {/* Inside Dhaka */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Inside Dhaka City</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Delivery Charge: ৳70</li>
                <li>Delivery Time: 2–3 working days</li>
                <li>Payment: Cash on Delivery (COD) available</li>
                <li>Our delivery partner will call you before arrival to confirm.</li>
              </ul>
            </section>

            {/* Sub-Urban */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Sub-Urban Areas (Near Dhaka)</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Delivery Charge: ৳100</li>
                <li>Delivery Time: 2–4 working days</li>
                <li>Payment: Cash on Delivery (COD) available</li>
                <li>You'll get a confirmation call from the rider/courier before delivery.</li>
              </ul>
            </section>

            {/* Outside Dhaka */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Outside Dhaka</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Delivery Charge: ৳120</li>
                <li>Advance payment required for delivery charge.</li>
                <li>Product price can be paid upon delivery (COD for product price only).</li>
                <li>Delivery Time: 3–5 working days</li>
                <li>Our courier partner will call you before delivering.</li>
              </ul>
            </section>

            {/* Important Notes */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Important Notes</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                <li>Delivery times are estimated and may vary due to courier delays, traffic, or weather conditions.</li>
                <li>If any unexpected delay occurs, our team will notify you.</li>
                <li>For smooth delivery, please ensure your phone number is active and reachable during working hours.</li>
                <li>If you are unavailable at the time of delivery, the courier may reschedule at their convenience.</li>
                <li>Delivery is handled by our own riders (inside Dhaka) or trusted third-party courier services (outside Dhaka).</li>
              </ul>
            </section>

            {/* Tracking & Support */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Tracking & Support</h2>
              <p className="text-muted-foreground mb-2">For order updates or delivery issues, you can always reach us:</p>
              <div className="text-muted-foreground space-y-1">
                <p>📞 01887362831</p>
                <p>📧 poshplexbd@gmail.com</p>
              </div>
              <p className="text-muted-foreground mt-3">We always aim to deliver your order fast, safe, and on point 🖤</p>
            </section>
          </div>
        </div>
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default ShippingDelivery;
