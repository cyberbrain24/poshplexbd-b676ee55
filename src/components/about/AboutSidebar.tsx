import { NavLink } from 'react-router-dom';

const aboutPages = [
  { name: 'Our Story', path: '/about/our-story' },
  { name: 'Find Us', path: '/about/store-locator' },
  { name: 'Privacy Policy', path: '/about/privacy-policy' },
  { name: 'Terms & Conditions', path: '/about/terms-conditions' },
  { name: 'Shipping & Delivery', path: '/about/shipping-delivery' }
];

const AboutSidebar = () => {
  return (
    <aside className="hidden md:block w-64 sticky top-32 h-fit px-6">
      <nav className="space-y-1">
        <h3 className="text-lg font-light text-foreground mb-6">About</h3>
        {aboutPages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `block py-2 text-sm font-light transition-all ${
                isActive
                  ? 'text-primary underline decoration-2 underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground hover:underline hover:decoration-1 hover:underline-offset-4'
              }`
            }
          >
            {page.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AboutSidebar;