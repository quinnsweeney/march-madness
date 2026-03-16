import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";

function App() {
  const [isMobileUser, setIsMobileUser] = useState(false);

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia(
      "(max-width: 900px), (hover: none) and (pointer: coarse)",
    );

    const updateMobileState = () => {
      setIsMobileUser(mobileMediaQuery.matches);
    };

    updateMobileState();

    if (typeof mobileMediaQuery.addEventListener === "function") {
      mobileMediaQuery.addEventListener("change", updateMobileState);
      return () =>
        mobileMediaQuery.removeEventListener("change", updateMobileState);
    }

    mobileMediaQuery.addListener(updateMobileState);
    return () => mobileMediaQuery.removeListener(updateMobileState);
  }, []);

  if (isMobileUser) {
    return (
      <main className="mobile-welcome-screen">
        <section className="mobile-welcome-card" aria-live="polite">
          <h1>This site is designed for desktop.</h1>
          <p>
            Hey, thanks for your interest in my web app! Head to{" "}
            <strong>mm.quinnsweeney.dev</strong> on your nearest laptop or
            computer to build and view your bracket :)
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      {/* Optional: Add a subtle minimalist header here later if desired, e.g. <header>Bracket</header> */}
      <Outlet />
    </>
  );
}

export default App;
