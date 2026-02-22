import { useFacebookPixel } from "@/hooks/useFacebookPixel";

/** Renders nothing — just activates the Facebook Pixel hook inside the Router context. */
const FacebookPixelTracker = () => {
  useFacebookPixel();
  return null;
};

export default FacebookPixelTracker;
