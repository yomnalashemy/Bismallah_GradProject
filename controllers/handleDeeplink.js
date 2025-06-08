export const handleDeeplink = async (req, res) => {
  const { to, token, lang = 'en' } = req.query;

  if (!to || !token) {
    return res.status(400).send("Missing token or destination.");
  }

  const encodedToken = encodeURIComponent(token);
  const encodedLang = encodeURIComponent(lang);
  const schemeUrl = `lupira://${to}?token=${encodedToken}&lang=${encodedLang}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="${encodedLang}">
      <head>
        <title>Opening Lupira App...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: sans-serif; text-align: center; padding-top: 40px; }
          a { color: #6A5ACD; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Opening the Lupira App...</h2>
        <p>If nothing happens, <a href="${schemeUrl}">tap here</a>.</p>
        <script>
          window.location.href = "${schemeUrl}";
          setTimeout(() => {
            document.body.innerHTML += "<p>If the app didn't open, please make sure it's installed or open it manually.</p>";
          }, 3000);
        </script>
      </body>
    </html>
  `);
};
