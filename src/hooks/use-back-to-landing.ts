import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Makes the browser's Back button on an auth screen (login, register, forgot password)
 * return to the landing page, whatever the user visited before. It adds one history
 * entry on top of the screen and, when that entry is popped, redirects to "/".
 */
export function useBackToLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    // Avoid stacking duplicates (React StrictMode runs effects twice in dev).
    if (!window.history.state?.authGuard) {
      window.history.pushState({ ...(window.history.state || {}), authGuard: true }, "");
    }

    const onPop = () => navigate("/", { replace: true });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);
}
