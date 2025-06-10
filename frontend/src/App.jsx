import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Reviews from './pages/Reviews';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const [isSSR, setIsSSR] = useState(false);

  useEffect(() => {
    // Check if the root element has server-rendered content
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.innerHTML.trim() && window.location.pathname === '/') {
      setIsSSR(true);
    }
  }, []);

  return (
    <Router>
      <div className="relative z-0">
        <ScrollToTop />
        <Routes>
          {/* If SSR content is present for '/', render an empty component to avoid hydration mismatch */}
          <Route path="/" element={isSSR ? <div /> : <Home />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/join" element={<div>Join Page (TBD)</div>} />
          <Route path="/services" element={<div>Services Page (TBD)</div>} />
          <Route path="/about" element={<div>About Page (TBD)</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;