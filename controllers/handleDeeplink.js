export const handleDeeplink = async (req, res) => {
  const { to, token } = req.query;

  if (!to || !token) {
    return res.status(400).send("Missing token or destination.");
  }

  const schemeUrl = `lupira://${to}?token=${token}`;

  // Return a fallback HTML with JS to open the app or show message
  res.send(`
    <!DOCTYPE html>
    <html>
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
        }, 2000);
      </script>
    </body>
    </html>
  `);
};
