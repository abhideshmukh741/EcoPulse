import { createContext, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Route order determines direction: higher index = "right" of lower index
export const ROUTE_ORDER = ["/", "/audit", "/dashboard", "/predictions", "/about", "/team", "/settings"];

export const NavDirectionContext = createContext({ directionRef: { current: 1 } });


export function useNavDirection() {
  return useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }) {
  const directionRef = useRef(1); // 1 = forward (right→left), -1 = backward (left→right)
  const location = useLocation();

  return (
    <NavDirectionContext.Provider value={{ directionRef }}>
      {children}
    </NavDirectionContext.Provider>
  );
}

/**
 * useNavLink — returns a navigate function that records direction before navigating.
 * Usage: const { go } = useNavLink();  go("/dashboard");
 */
export function useNavLink() {
  const navigate = useNavigate();
  const location = useLocation();
  const { directionRef } = useContext(NavDirectionContext);

  const go = (to) => {
    const fromIdx = ROUTE_ORDER.indexOf(location.pathname);
    const toIdx = ROUTE_ORDER.indexOf(to);
    // forward if going to higher index (or unknown), backward otherwise
    directionRef.current = toIdx >= fromIdx ? 1 : -1;
    navigate(to);
  };

  return { go, directionRef };
}
