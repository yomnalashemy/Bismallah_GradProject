export const handleDeeplink = async (req, res) => {
  const { to, token } = req.query;

  if (!to || !token) {
    return res.status(400).send("Missing token or destination.");
  }

  // ✅ Redirect to frontend route on the same domain
  const fallbackWebPage = `https://lupira.onrender.com/${to}?token=${token}`;

  return res.redirect(fallbackWebPage); //  Now it will work in email clients and browsers
};
