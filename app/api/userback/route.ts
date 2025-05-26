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
          window.Userback = window.Userback || {};
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
        console.log('Initializing Userback with access token');
        
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
          
          // Initialize Userback using the official format
          window.Userback = window.Userback || {};
          window.Userback.access_token = "${userbackToken}";
          
          // Set user data if available (optional)
          if (typeof window !== 'undefined' && window.userbackUserData) {
            window.Userback.user_data = window.userbackUserData;
          }
          
          console.log('Userback access token set');
          
          // Load the Userback script using official method
          (function(d) {
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://static.userback.io/widget/v1.js';
            
            s.onload = function() {
              console.log('Userback widget script loaded successfully');
            };
            
            s.onerror = function() {
              console.error('Failed to load Userback widget script');
            };
            
            // Only add script if not already present
            if (!d.querySelector('script[src*="userback.io"]')) {
              (d.head || d.body).appendChild(s);
              console.log('Userback script added to document');
            } else {
              console.log('Userback script already exists');
            }
          })(document);
          
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
        window.Userback = window.Userback || {};
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
