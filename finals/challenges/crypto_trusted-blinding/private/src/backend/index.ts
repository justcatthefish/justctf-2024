import express from "express";
import cors from "cors";
import { rateLimit } from 'express-rate-limit'

const app = express();

var corsOptions = {
  origin: process.env.CORS as string || "http://localhost:9000"
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// rate limits
app.set('trust proxy', 1);
if (process.env.RATE_LIMIT_IP) {
  const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    limit: 6, // Limit each IP to 3 requests per `window` (here, per 30 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    skip: (req: any, _) => {
      const limitedApis = ["auth/signup", "user/config"];
      for (var api of limitedApis) {
        if (req.path.indexOf(api) >= 0) {
          return false;
        }
      }
      return true;
    }
  });
  app.use(limiter);
}

import { db } from "./app/models/index.js";

// force: true will drop the table if it already exists
db.sequelize.sync({ force: false }).then(() => {
  console.log(`Resync DB with force false`);
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Trusted Blinding!" });
});

import { authRoutes } from "./app/routes/auth.routes.js";
import { userRoutes } from "./app/routes/user.routes.js";
authRoutes(app);
userRoutes(app);

// set port, listen for requests
const PORT = Number(process.env.PORT as string) || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
