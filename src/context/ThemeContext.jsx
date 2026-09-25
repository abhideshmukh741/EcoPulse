import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Read initial theme from localStorage or default to 'light' (clean/professional)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ecoPulseTheme');
    return saved ? saved : 'light';
  });

  // Whenever theme changes, update localStorage and the <html> tag classes
  useEffect(() => {
    localStorage.setItem('ecoPulseTheme', theme);
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      bodyEl.classList.add('dark');
      htmlEl.classList.remove('light');
      bodyEl.classList.remove('light');
    } else {
      htmlEl.classList.add('light');
      bodyEl.classList.add('light');
      htmlEl.classList.remove('dark');
      bodyEl.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
