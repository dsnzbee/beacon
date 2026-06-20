import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
 
// If the browser does NOT support CSS backdrop-filter, inject a blurred
// fixed background element before the app root as a reliable fallback.
try {
  const supportsBackdrop =
    typeof window !== 'undefined' &&
    (CSS?.supports?.('backdrop-filter', 'blur(1px)') || CSS?.supports?.('-webkit-backdrop-filter', 'blur(1px)'));

  if (!supportsBackdrop && typeof document !== 'undefined') {
    const root = document.getElementById('root');
    const el = document.createElement('div');
    el.className = 'bg-blur-fallback';
    // Insert before root so we can hide the original .backimg via sibling selector
    document.body.insertBefore(el, root);
  }
} catch (e) {
  // If anything goes wrong, silently continue — app still renders.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
