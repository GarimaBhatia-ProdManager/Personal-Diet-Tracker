import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use a server-only environment variable (without NEXT_PUBLIC_ prefix)
    const userbackToken = process.env.USERBACK_TOKEN

    console.log("Userback token exists:", !!userbackToken)

    if (!userbackToken) {
      console.warn("USERBACK_TOKEN environment variable not found")
      const emptyScript = `
        console.warn('Userback not configured - USERBACK_TOKEN environment variable missing');
        if (typeof window !== 'undefined') {
          window.Userback = window.Userback || [];
          window.Userback.open = function() {
            console.warn('Userback not available, falling back to email');
            window.location.href = 'mailto:feedback@example.com?subject=App Feedback';
          };
        }
      `
      return new NextResponse(emptyScript, {
        status: 200,
        headers: {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-cache",
        },
      })
    }

    const script = `
      (function() {
        console.log('Initializing Userback with token');
        
        if (typeof window === 'undefined') {
          console.warn('Window not available');
          return;
        }
        
        if (window.userbackInitialized) {
          console.log('Userback already initialized');
          return;
        }
        
        try {
          window.userbackInitialized = true;
          window.Userback = window.Userback || [];
          
          // Initialize with token
          window.Userback.push(['init', { 
            token: '${userbackToken}',
            debug: true
          }]);
          
          console.log('Userback init command pushed');
          
          // Load the Userback script
          var script = document.createElement('script');
          script.src = 'https://static.userback.io/widget/v1.js';
          script.async = true;
          
          script.onload = function() {
            console.log('Userback widget script loaded successfully');
          };
          
          script.onerror = function() {
            console.error('Failed to load Userback widget script');
          };
          
          // Only add script if not already present
          if (!document.querySelector('script[src*="userback.io"]')) {
            document.head.appendChild(script);
            console.log('Userback script added to head');
          } else {
            console.log('Userback script already exists');
          }
          
        } catch (error) {
          console.error('Userback initialization error:', error);
        }
      })();
    `

    return new NextResponse(script, {
      status: 200,
      headers: {
        "Content-Type": "text/javascript",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("API route error:", error)

    const errorScript = `
      console.error('Userback API route error');
      if (typeof window !== 'undefined') {
        window.Userback = window.Userback || [];
        window.Userback.open = function() {
          window.location.href = 'mailto:feedback@example.com?subject=App Feedback';
        };
      }
    `

    return new NextResponse(errorScript, {
      status: 200,
      headers: {
        "Content-Type": "text/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }
}
