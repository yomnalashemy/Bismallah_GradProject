export const handleDeeplink = async (req, res) => {
  const { to, token, lang = 'en' } = req.query;

  if (!to || !token) {
    return res.status(400).send("Missing token or destination.");
  }

  const encodedToken = encodeURIComponent(token);
  const encodedLang = encodeURIComponent(lang);
  const schemeUrl = `lupira://${to}?token=${encodedToken}&lang=${encodedLang}`;
  const webUrl = `/api/auth/verify-email?token=${encodedToken}&lang=${encodedLang}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="${encodedLang}">
      <head>
        <title>Opening Lupira App...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: sans-serif; text-align: center; padding-top: 40px; }
          a { color: #6A5ACD; font-weight: bold; }
          .button { display: inline-block; margin: 16px 0; padding: 14px 28px; background-color: #28a745; color: #fff; text-decoration: none; font-size: 16px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h2>Opening the Lupira App...</h2>
        <p>If nothing happens, <a href="${schemeUrl}">tap here</a>.</p>
        <div style="margin: 32px 0;">
          <a href="${webUrl}" class="button">Verify via Website</a>
        </div>
        <script>
          window.location.href = "${schemeUrl}";
          setTimeout(function() {
            document.body.innerHTML += '<p>If the app didn\'t open, <a href="${webUrl}">click here to verify via website</a>.</p>';
          }, 3000);
        </script>
      </body>
    </html>
  `);
};