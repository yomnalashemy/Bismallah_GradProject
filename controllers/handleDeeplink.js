// controllers/deeplink.controller.js
export const handleDeeplink = async (req, res) => {
  const { to, token } = req.query;

  if (!to || !token) {
    return res.status(400).send("Missing token or destination.");
  }

  const deepLink = `lupira://${to}?token=${token}`;
  return res.redirect(deepLink); // Redirects to mobile app
};
