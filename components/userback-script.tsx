import Script from "next/script"

export function UserbackScript() {
  const userbackToken = process.env.USERBACK_TOKEN

  if (!userbackToken) {
    return null
  }

  return (
    <Script
      id="userback-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.Userback = window.Userback || {};
          Userback.access_token = "${userbackToken}";
          (function(d) {
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://static.userback.io/widget/v1.js';
            (d.head || d.body).appendChild(s);
          })(document);
        `,
      }}
    />
  )
}
