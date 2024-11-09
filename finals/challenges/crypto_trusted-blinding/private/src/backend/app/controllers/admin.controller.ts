import { RequestHandler } from "express";
import { config as authConfig } from "../config/auth.config.js";

export const config: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    user.blindRsaVariant = req.body.rsaVariant;

    await user.save();
    return res.status(200).send({message: "Updated"});
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
};
