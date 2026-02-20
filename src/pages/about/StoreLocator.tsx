import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import StoreMap from "../../components/about/StoreMap";
import { Button } from "../../components/ui/button";
import AboutSidebar from "../../components/about/AboutSidebar";

const StoreLocator = () => {
  const stores = [
    {
      name: "POSHPLEX Dhaka",
      address: "Dhaka, Bangladesh",
      phone: "+880 1XXXXXXXXX",
      hours: "Sat-Thu: 10AM-8PM, Fri: 2PM-8PM",
      services: ["Browse & Buy", "Custom Orders", "Exchange & Returns"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader 
            title="Store Locator" 
            subtitle="Visit us in person for a personalized streetwear experience"
          />
          
          <ContentSection title="Interactive Store Map">
            <StoreMap />
          </ContentSection>

          <ContentSection title="Our Locations">
            <div className="grid gap-8">
              {stores.map((store, index) => (
                <div key={index} className="bg-background p-8 border border-border">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-light text-foreground">{store.name}</h3>
                      <div className="space-y-2 text-muted-foreground">
                        <p>{store.address}</p>
                        <p>{store.phone}</p>
                        <p>{store.hours}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button variant="outline" className="rounded-none">
                          Get Directions
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-light text-foreground">Available Services</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {store.services.map((service, serviceIndex) => (
                          <li key={serviceIndex} className="text-sm text-muted-foreground flex items-center">
                            <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                            {service}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>
        </main>
      </div>
      
      <PoshplexFooter />
    </div>
  );
};

export default StoreLocator;
