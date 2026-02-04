import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube } from "lucide-react";

const PoshplexFooter = () => {
  return (
    <footer className="w-full bg-foreground text-background mt-20">
      {/* Main Footer Content */}
      <div className="px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5">
            <span className="text-3xl font-black tracking-tighter block mb-6">
              POSHPLEX
            </span>
            <p className="text-background/70 text-sm mb-6 max-w-sm">
              Premium streetculture apparel for the bold. Dhaka-based, shipping nationwide.
            </p>
            
            {/* Newsletter */}
            <div className="mb-8">
              <p className="text-xs font-medium tracking-wider mb-3">
                JOIN THE MOVEMENT
              </p>
              <div className="flex">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-transparent border border-background/30 px-4 py-3 text-sm placeholder:text-background/50 focus:outline-none focus:border-background"
                />
                <button className="bg-background text-foreground px-6 py-3 text-sm font-medium tracking-wider hover:bg-background/90 transition-colors">
                  SUBSCRIBE
                </button>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                <Youtube size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Shop */}
            <div>
              <h4 className="text-xs font-medium tracking-wider mb-4">SHOP</h4>
              <ul className="space-y-3">
                <li><Link to="/category/new-drops" className="text-sm text-background/70 hover:text-background transition-colors">New Drops</Link></li>
                <li><Link to="/category/men" className="text-sm text-background/70 hover:text-background transition-colors">Men</Link></li>
                <li><Link to="/category/women" className="text-sm text-background/70 hover:text-background transition-colors">Women</Link></li>
                <li><Link to="/category/accessories" className="text-sm text-background/70 hover:text-background transition-colors">Accessories</Link></li>
                <li><Link to="/category/sale" className="text-sm text-background/70 hover:text-background transition-colors">Sale</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-xs font-medium tracking-wider mb-4">HELP</h4>
              <ul className="space-y-3">
                <li><Link to="/size-guide" className="text-sm text-background/70 hover:text-background transition-colors">Size Guide</Link></li>
                <li><Link to="/shipping" className="text-sm text-background/70 hover:text-background transition-colors">Shipping</Link></li>
                <li><Link to="/returns" className="text-sm text-background/70 hover:text-background transition-colors">Returns</Link></li>
                <li><Link to="/faq" className="text-sm text-background/70 hover:text-background transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-sm text-background/70 hover:text-background transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-xs font-medium tracking-wider mb-4">ABOUT</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-background/70 hover:text-background transition-colors">Our Story</Link></li>
                <li><Link to="/stores" className="text-sm text-background/70 hover:text-background transition-colors">Stores</Link></li>
                <li><Link to="/careers" className="text-sm text-background/70 hover:text-background transition-colors">Careers</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/20 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            © 2025 POSHPLEX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-xs text-background/50 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-xs text-background/50 hover:text-background transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PoshplexFooter;