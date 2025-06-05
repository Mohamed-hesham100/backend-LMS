import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const token = jwt.sign(
    { userId: userId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
  return token;
};
