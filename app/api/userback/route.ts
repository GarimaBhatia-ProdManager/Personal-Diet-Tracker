import { NextResponse } from "next/server"

export async function GET() {
  try {
    const userbackToken = process.env.NEXT_PUBLIC_USERBACK_TOKEN

    if (!userbackToken) {
      return NextResponse.json({ error: "Userback not configured" }, { status: 404 })
    }

    // Return the Userback initialization script
    const script = `
      (function() {
        if (window.userbackInitialized) return;
        window.userbackInitialized = true;
        
        window.Userback = window.Userback || [];
        window.Userback.push(['init', { token: '${userbackToken}' }]);
        
        var script = document.createElement('script');
        script.src = 'https://static.userback.io/widget/v1.js';
        script.async = true;
        
        script.onload = function() {
          console.log('Userback loaded successfully');
        };
        
        script.onerror = function() {
          console.warn('Failed to load Userback');
        };
        
        if (!document.querySelector('script[src*="userback.io"]')) {
          document.head.appendChild(script);
        }
      })();
    `

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error serving Userback script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
