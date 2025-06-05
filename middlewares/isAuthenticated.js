import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization ;
    let token;

    // جلب التوكن من الهيدر أو الكوكي
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
        error: true,
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId; 
    next();

  } catch (error) {
    console.error("JWT Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        error: true,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: true,
      });
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid token",
      error: true,
    });   
  }
};

export default isAuthenticated;
