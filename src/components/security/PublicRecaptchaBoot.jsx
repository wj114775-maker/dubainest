import { useEffect } from "react";
import { preloadRecaptchaScript } from "@/lib/recaptcha";

export default function PublicRecaptchaBoot() {
  useEffect(() => {
    preloadRecaptchaScript().catch(() => {});
  }, []);

  return null;
}
