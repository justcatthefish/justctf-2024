import { RequestHandler } from 'express';
import {default as jwt} from "jsonwebtoken";
import { config } from "../config/auth.config.js";
import { UserType } from '../models/user.model.js';
import { db } from '../models/index.js';
const User = db.user;

export async function getUser(userId: number | null): Promise<UserType> {
  if (!userId) {
    throw new Error("No id");
  }

  try {
      const user = await User.findOne({
          where: {
              id: userId
          }
      });
      if (!user) {
          throw new Error("Empty user");
      }
      return user;
  } catch (err) {
      throw err;
  }
}

const checkJwt: RequestHandler = (req, res, next) => {
  let token = req.headers["x-access-token"] as string;

  if (!token) {
      res.status(401).send({
        message: "No token provided!"
      });
      return;
  }

  jwt.verify(token, config.secret, async (err: any, decoded: any) => {
    if (err) {
      res.status(401).send({
        message: "Unauthorized!"
      });
      return;
    }
    try {
      const user = await getUser(decoded.id);
      if ((req as any).checkVerify && !user.verified) {
        res.status(401).send({
          message: "Not verified!"
        });
        return;
      }
      (req as any).user = user;
    } catch {
      res.status(401).send({
        message: "Unauthorized!"
      });
      return;
    }
    next();
  });
}

const login: RequestHandler = (req, res, next) => {
  (req as any).checkVerify = true;
  checkJwt(req, res, next);
};

const loginNoVerify: RequestHandler = (req, res, next) => {
  checkJwt(req, res, next);
};

export const authJwt = {
  login: login,
  loginNoVerify: loginNoVerify
};
