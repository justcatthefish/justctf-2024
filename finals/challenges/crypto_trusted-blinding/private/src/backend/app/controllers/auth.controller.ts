import { RequestHandler } from "express";
import { db } from "../models/index.js";
import { config } from "../config/auth.config.js";
import { randomBytes, createHash } from "crypto";
const User = db.user;

import {default as jwt} from "jsonwebtoken";
import { default as bcrypt } from 'bcryptjs'

export const signup: RequestHandler = (req, res) => {
  // Generate challenge
  const challenge = randomBytes(config.challenge_prefix_len).toString('hex');

  // Save User to Database
  User.create({
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    verified: false,
    challenge: challenge,
    oidcUser: "",
    oidcKey: "",
    blindRsaVariant: 0,
    blindInv: "",
    blindPreparedMsg: "",
    poem: "",
    signature: "",
    canPublish: false
  })
    .then(user => {
        res.status(200).send({
          message: "User registered successfully!",
          challenge: challenge,
          difficulty: config.challenge_difficulty
        });      
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

export const verify: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    const zeros = '0'.repeat(config.challenge_difficulty)
    const answer = req.body.answer;
    let h = createHash('sha256');
    h.update(user.challenge + answer);
    const hash = h.digest();

    let bin = '';
    for (let c of hash) {
      bin += c.toString(2).padStart(8, '0');
    }

    if (!bin.startsWith(zeros)) {
      res.status(400).send({
        message: "Wrong answer",
        challenge: user.challenge,
        difficulty: config.challenge_difficulty,
        asnwer: answer
      });
      return;
    }

    user.verified = true;
    
    await user.save();
    res.status(200).send({ message: "Verified" });
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
}

export const signin: RequestHandler = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      const token = jwt.sign({ id: user.id },
                              config.secret,
                              {
                                algorithm: 'HS256',
                                allowInsecureKeySizes: false,
                                expiresIn: 3600, // 1 hour
                              });

      res.status(200).send({
        id: user.id,
        email: user.email,
        accessToken: token
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

export const destroy: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }
    await user.destroy();
    res.status(200).send({message: "destroyed"});
  } catch {
    res.status(500).send({message: "Unknown error"});
  }
};