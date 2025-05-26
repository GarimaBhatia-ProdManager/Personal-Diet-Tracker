import { NextResponse } from "next/server"

export async function GET() {
  // Use a server-only environment variable (without NEXT_PUBLIC_ prefix)
  const userbackToken = process.env.USERBACK_TOKEN

  if (!userbackToken) {
    const emptyScript = `
      console.warn('Userback not configured');
      if (typeof window !== 'undefined') {
        window.Userback = window.Userback || [];
      }
    `
    return new NextResponse(emptyScript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    })
  }

  const script = `
    (function() {
      if (typeof window === 'undefined') return;
      if (window.userbackInitialized) return;
      
      try {
        window.userbackInitialized = true;
        window.Userback = window.Userback || [];
        window.Userback.push(['init', { token: '${userbackToken}' }]);
        
        var script = document.createElement('script');
        script.src = 'https://static.userback.io/widget/v1.js';
        script.async = true;
        
        script.onload = function() {
          console.log('Userback widget loaded');
        };
        
        script.onerror = function() {
          console.warn('Failed to load Userback widget');
        };
        
        if (!document.querySelector('script[src*="userback.io"]')) {
          document.head.appendChild(script);
        }
      } catch (error) {
        console.warn('Userback initialization error:', error);
      }
    })();
  `

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  })
}
