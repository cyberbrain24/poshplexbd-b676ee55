import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";

const CustomerCare = () => {
  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader 
            title="Customer Care" 
            subtitle="We're here to help you with all your orders and queries"
          />
          
          <ContentSection title="Contact Information">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Phone / WhatsApp</h3>
                <p className="text-muted-foreground">+880 1XXXXXXXXX</p>
                <p className="text-sm text-muted-foreground">Sat-Thu: 10AM-8PM<br />Fri: 2PM-8PM</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Email</h3>
                <p className="text-muted-foreground">support@poshplex.com</p>
                <p className="text-sm text-muted-foreground">Response within 24 hours</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">WhatsApp Chat</h3>
                <Button variant="outline" className="rounded-none">
                  Start Chat
                </Button>
                <p className="text-sm text-muted-foreground">Available during business hours</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Frequently Asked Questions">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="shipping" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are your shipping options and timeframes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We deliver within Dhaka in 1-2 business days and outside Dhaka in 3-5 business days. Cash on Delivery (COD) is available for all orders.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="returns" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer a 7-day return/exchange policy for unworn items in original condition with tags attached. Please contact us via WhatsApp to initiate a return.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sizing" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I find the right size?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Each product page includes a size guide. Our drop shoulder tees and hoodies run true to size. If you're between sizes, we recommend sizing up for a relaxed streetwear fit.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What payment methods do you accept?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We accept Cash on Delivery (COD), bKash, Nagad, and Bank Transfer. All payment details are provided at checkout.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tracking" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How can I track my order?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Once your order is shipped, you'll receive a tracking number via SMS or WhatsApp. You can also track your order on our Order Tracking page.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ContentSection>

          <ContentSection title="Contact Form">
            <div>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-light text-foreground">First Name</label>
                    <Input className="rounded-none" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-light text-foreground">Last Name</label>
                    <Input className="rounded-none" placeholder="Enter your last name" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Phone / Email</label>
                  <Input className="rounded-none" placeholder="Enter your phone number or email" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Order Number (Optional)</label>
                  <Input className="rounded-none" placeholder="Enter your order number if applicable" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">How can we help you?</label>
                  <Textarea 
                    className="rounded-none min-h-[120px]" 
                    placeholder="Please describe your inquiry in detail"
                  />
                </div>
                
                <Button type="submit" className="w-full rounded-none">
                  Send Message
                </Button>
              </form>
            </div>
          </ContentSection>
        </main>
      </div>
      
      <PoshplexFooter />
    </div>
  );
};

export default CustomerCare;
