export default async function UserbackScript() {
  // Get the token server-side only
  const userbackToken = process.env.NEXT_PUBLIC_USERBACK_TOKEN

  if (!userbackToken) {
    return null
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Initialize Userback queue first
            window.Userback = window.Userback || [];
            
            // Queue the init command
            window.Userback.push(['init', { token: '${userbackToken}' }]);
            
            // Load Userback script
            var script = document.createElement('script');
            script.src = 'https://static.userback.io/widget/v1.js';
            script.async = true;
            
            script.onload = function() {
              console.log('Userback script loaded successfully');
            };
            
            script.onerror = function() {
              console.warn('Failed to load Userback script');
            };
            
            // Only add script if it doesn't exist
            if (!document.querySelector('script[src*="userback.io"]')) {
              document.head.appendChild(script);
            }
          })();
        `,
      }}
    />
  )
}
