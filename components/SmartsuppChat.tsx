'use client'
import { useEffect } from 'react'

// Tell TypeScript that these properties exist on the global window object
declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
  }
}

export default function SmartsuppChat() {
  useEffect(() => {
    // 1. Initialize the global configuration object with your key
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = '56452ef6ba9db11e12c6de3545e31098d40200b9';

    // 2. Initialize the smartsupp loader function if it doesn't exist
    if (!window.smartsupp) {
      window.smartsupp = function (...args: any[]) {
        window.smartsupp._.push(args);
      };
      window.smartsupp._ = [];
    }

    // 3. Create and inject the Smartsupp script
    const s1 = document.createElement('script');
    const s0 = document.getElementsByTagName('script')[0];
    
    s1.type = 'text/javascript';
    s1.charset = 'utf-8';
    s1.async = true;
    s1.src = 'https://www.smartsuppchat.com/loader.js?';

    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }
  }, [])

  return (
    <noscript>
      Powered by <a href="https://www.smartsupp.com" target="_blank" rel="noopener noreferrer">Smartsupp</a>
    </noscript>
  )
}