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
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.innerHTML.trim() && window.location.pathname === '/') {
      setIsSSR(true);
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* For SSR homepage, render nothing to match the server-rendered HTML */}
        <Route path="/" element={isSSR ? null : <Home />} />
        {/* Other routes wrap content in a div for styling */}
        <Route path="/reviews" element={<div className="relative z-0"><Reviews /></div>} />
        <Route path="/join" element={<div className="relative z-0"><div>Join Page (TBD)</div></div>} />
        <Route path="/services" element={<div className="relative z-0"><div>Services Page (TBD)</div></div>} />
        <Route path="/about" element={<div className="relative z-0"><div>About Page (TBD)</div></div>} />
        <Route path="*" element={<div className="relative z-0"><div><h1>Not Found</h1><p>Page not found (client-side).</p></div></div>} />
      </Routes>
    </Router>
  );
}

export default App;
