import { Express } from 'express';
import { authJwt, validate } from "../middleware/index.js";
import * as  controller from "../controllers/auth.controller.js";

export function authRoutes(app: Express) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [validate.checkDuplicateEmail],
    controller.signup
  );

  app.post(
    "/api/auth/verify",
    [authJwt.loginNoVerify, validate.checkAnswer],
    controller.verify
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/destroy", [authJwt.login], controller.destroy);
};
