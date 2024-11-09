import { RequestHandler } from "express";
import { Sequelize } from "sequelize";
import { getPubkey } from "./utils.js";
import { db } from "../models/index.js";
const User = db.user;

export const readPoem: RequestHandler = async (req, res) => {
  try {
    const randomUsers = await User.findAll({
      order: db.sequelize.random(),
      limit: 1,
      where: {
        canPublish: true
      }
    })
    if (randomUsers.length <= 0) {
      res.status(200).send({message: "No public poems"});
      return;
    }
    res.status(200).send({message: randomUsers[0].poem});
  } catch(err) {
    res.status(500).send({message: "Unknown error"});
  }
};

export const info: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    var poem = "";
    if (user.canPublish === true) {
      poem = user.poem;
    }

    const resp = {
      email: user.email,
      oidcUser: user.oidcUser,
      oidcKey: user.oidcKey,
      rsaVariant: user.blindRsaVariant,
      poem: poem,
      signature: user.signature
    };
    return res.status(200).send(resp);
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
}

export const config: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    user.oidcUser = req.body.oidcUser;
    user.oidcKey = req.body.oidcKey;

    var publicKey;
    try {
      publicKey = await getPubkey(user);
    } catch (err) {
      var errorMessage = "Public key not found for the user.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      res.status(404).send({message: errorMessage});
      return;
    }

    user.publicKey = publicKey;

    await user.save();
    return res.status(200).send({message: "Updated"});
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
};

export const poem: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    user.poem = req.body.poem;
    user.canPublish = false;

    await user.save();
    return res.status(200).send({message: "Poem saved"});
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
};
