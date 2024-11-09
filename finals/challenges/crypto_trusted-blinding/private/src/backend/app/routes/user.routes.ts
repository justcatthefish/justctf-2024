import { Express } from 'express';
import { authJwt, validate } from "../middleware/index.js";
import { config } from "../config/auth.config.js";
import * as user from "../controllers/user.controller.js";
import * as oidc from "../controllers/oidc.controller.js";
import * as admin from "../controllers/admin.controller.js";

export function userRoutes(app: Express) {
  app.use(function (req, res, next) {
    if (req.get("Trusted-Blinding-Proxy-Key") !== config.rev_proxy_secret) {
      res.status(403).send("Access only through proxy");
      return;
    }

    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/read", user.readPoem);

  app.get(
    "/api/user",
    [authJwt.login],
    user.info
  );

  app.post(
    "/api/user/config",
    [authJwt.login, validate.checkUserConfig],
    user.config
  );

  app.post(
    "/api/poem",
    [authJwt.login, validate.checkPoem],
    user.poem
  );

  app.post(
    "/api/blind/init",
    [authJwt.login, validate.checkOidc, validate.checkBlindInit],
    oidc.blindInit
  );

  app.post(
    "/api/blind/finalize",
    [authJwt.login, validate.checkOidc, validate.checkBlindFinalize],
    oidc.blindFinalize
  );

  app.post(
    "/admin/config",
    [authJwt.login, validate.checkBlindConfig],
    admin.config
  );
};
