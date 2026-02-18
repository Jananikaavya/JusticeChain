// api/auth/register.js
import User from "../../models/User";

export default async function handler(req, res) {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role: "user",
    verified: false
  });

  res.json({ success: true, user });
}
