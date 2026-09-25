import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ScrollProgressBar, { ScrollToTopButton } from "./components/ScrollProgressBar";
import Login from "./Login";

import Home from "./pages/Home";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import Predictions from "./pages/Predictions";
import AdminSettings from "./pages/AdminSettings";
import About from "./pages/About";
import Team from "./pages/Team";

import { NavDirectionContext, ROUTE_ORDER } from "./context/NavDirection";
import { ThemeProvider } from "./context/ThemeContext";

// Corner-sweep wheel transition (45°) — GPU-friendly: transform + opacity only (no blur)
function makeSlideVariants(directionRef) {
  return {
    initial: () => {
      const dir = directionRef.current || 1;
      return {
        opacity: 0,
        rotate: dir * 45,
        y: -40,
        scale: 0.94,
        transformOrigin: "50% 220%",
      };
    },
    animate: {
      opacity: 1,
      rotate: 0,
      y: 0,
      scale: 1,
      transformOrigin: "50% 220%",
      transition: {
        duration: 0.55,
        ease: [0.32, 0.72, 0, 1],
      },
    },
    exit: () => {
      const dir = directionRef.current || 1;
      return {
        opacity: 0,
        rotate: dir * -35,
        y: 30,
        scale: 0.96,
        transformOrigin: "50% 220%",
        transition: {
          duration: 0.38,
          ease: [0.4, 0, 1, 1],
        },
      };
    },
  };
}

function SlideWrapper({ children, directionRef }) {
  const variants = makeSlideVariants(directionRef);
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        width: "100%",
        originX: 0.5,
        originY: 2.2,
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes({ directionRef, adminUser, onOpenAdmin }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <SlideWrapper key={location.pathname} directionRef={directionRef}>
        <Routes location={location}>
          {/* pages */}
          <Route path="/" element={<Home />} />
          <Route path="/audit" element={<Calculator />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/powerbi" element={<Dashboard />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route
            path="/settings"
            element={
              adminUser ? (
                <AdminSettings />
              ) : (
                <div className="page" style={{ padding: "80px 24px", textAlign: "center" }}>
                  <h2>Admin login required</h2>
                  <p style={{ color: "#64748B", margin: "12px 0 20px" }}>
                    Sign in to access Campus Settings &amp; Compliance.
                  </p>
                  <button type="button" className="login-btn" onClick={onOpenAdmin} style={{ display: "inline-flex" }}>
                    Open Admin Login
                  </button>
                </div>
              )
            }
          />
          <Route
            path="/admin"
            element={
              adminUser ? (
                <AdminSettings />
              ) : (
                <div className="page" style={{ padding: "80px 24px", textAlign: "center" }}>
                  <h2>Admin login required</h2>
                  <button type="button" className="login-btn" onClick={onOpenAdmin} style={{ display: "inline-flex", marginTop: 16 }}>
                    Open Admin Login
                  </button>
                </div>
              )
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route
            path="*"
            element={
              <div className="page" style={{ padding: "80px 24px", textAlign: "center" }}>
                <h2>Page not found</h2>
                <p style={{ color: "#64748B", marginTop: 8 }}>The route you opened does not exist.</p>
              </div>
            }
          />
        </Routes>
      </SlideWrapper>
    </AnimatePresence>
  );
}

function App() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return Boolean(localStorage.getItem("ecopulse_token"));
    } catch {
      return false;
    }
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const directionRef = useRef(1);

  const handleNavClick = (to, currentPath) => {
    const normalize = (p) => {
      if (p === "/calculator") return "/audit";
      if (p === "/powerbi") return "/dashboard";
      if (p === "/admin") return "/settings";
      return p;
    };
    const fromIdx = ROUTE_ORDER.indexOf(normalize(currentPath));
    const toIdx = ROUTE_ORDER.indexOf(normalize(to));
    directionRef.current = toIdx >= fromIdx ? 1 : -1;
  };

  const handleLogout = () => {
    localStorage.removeItem("ecopulse_token");
    localStorage.removeItem("ecopulse_user");
    setAdminUser(false);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavDirectionContext.Provider value={{ directionRef }}>
          <ScrollToTop />
          <ScrollProgressBar />
          <ScrollToTopButton />
          <div className="app admin-portal-theme transition-colors duration-300">
            <div className="blob blob-one" />
            <div className="blob blob-two" />
            <div className="grid-background" />

            <Navbar
              adminUser={adminUser}
              onToggleAdmin={handleLogout}
              onOpenAdminModal={() => setAdminModalOpen(true)}
              onNavClick={handleNavClick}
            />

            <main className="main-content">
              <AnimatedRoutes
                directionRef={directionRef}
                adminUser={adminUser}
                onOpenAdmin={() => setAdminModalOpen(true)}
              />
            </main>

            <Footer onOpenAdmin={() => setAdminModalOpen(true)} />

            {adminModalOpen && (
              <Login
                onClose={() => setAdminModalOpen(false)}
                onLoginSuccess={() => {
                  setAdminUser(true);
                  setAdminModalOpen(false);
                }}
              />
            )}
          </div>
        </NavDirectionContext.Provider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
