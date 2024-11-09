import { RequestHandler } from "express";
import { db } from "../models/index.js";
import { variants } from "../controllers/utils.js"
const User = db.user;

const checkDuplicateEmail: RequestHandler = (req, res, next) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Failed! Email is already in use!"
      });
      return;
    }

    next();
  });
};

const checkAnswer: RequestHandler = (req, res, next) => {
  if (!req.body.answer || req.body.answer.length < 1 || req.body.answer.length > 255) {
    res.status(400).send({
      message: "No answer"
    });
    return;
  }
  next();
}


function isAlphaNumeric(input: string): boolean {
  const regex = /^[a-z0-9]+$/i;
  return regex.test(input); 
}

function isNumber(input: any): boolean {
  const regex = /^[0-9]+$/i;
  return regex.test(input); 
}

function isBase64(input: string): boolean {
  const regex = /^[a-z0-9=\/\+]+$/i;
  return regex.test(input); 
}

const checkUserConfig: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    res.status(400).send({
      message: "Not logged in!"
    });
    return;
  }

  if (!req.body.oidcUser || !req.body.oidcKey) {
    res.status(400).send({
      message: "Failed! No OIDC configuration!"
    });
    return;
  }

  if (!isAlphaNumeric(req.body.oidcUser) || req.body.oidcUser.length >= 100) {
    res.status(400).send({
      message: "Failed! Invalid OIDC user!"
    });
    return;
  }

  if (!isAlphaNumeric(req.body.oidcKey) || req.body.oidcKey.length >= 100) {
    res.status(400).send({
      message: "Failed! Invalid OIDC key!"
    });
    return;
  }

  if (user.oidcUser || user.oidcKey) {
    res.status(400).send({
      message: "Failed! OIDC already configured!"
    });
    return;
  }
  next();
}

const checkOidc: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    res.status(400).send({
      message: "Not logged in!"
    });
    return;
  }
  if (!user.oidcUser || !user.oidcKey || !user.publicKey) {
    res.status(400).send({
      message: "OIDC not configured!"
    });
    return;
  }
  if (!user.poem) {
    res.status(400).send({
      message: "Poem not written!"
    });
    return;
  }
  next();
}

const checkPoem: RequestHandler = (req, res, next) => {
  if (!req.body.poem || req.body.poem.length > 1024) {
    res.status(400).send({
      message: "Poem rejected!"
    });
    return;
  }
  next();
}

const checkBlindConfig: RequestHandler = (req, res, next) => {
  if (!req.body.rsaVariant || !isNumber(req.body.rsaVariant) || req.body.rsaVariant.length > 100) {
    res.status(404).send({message: "No rsaVariant"});
    return;
  }
  const rsaVariant = Number(req.body.rsaVariant);
  if (rsaVariant < 0 || rsaVariant >= variants.length) {
    res.status(404).send({message: "Invalid rsaVariant"});
    return;
  }
  next();
}


const checkBlindInit: RequestHandler = (req, res, next) => {
  if (req.body.type) {
    if (isNumber(req.body.type) || req.body.type.length > 100) {
      res.status(404).send({message: "Invalid type"});
      return;
    }
  }
  next();
}

const checkBlindFinalize: RequestHandler = (req, res, next) => {
  if (!req.body.blindSignature || req.body.blindSignature.length > 6827) {
    res.status(404).send({message: "No blinded signature"});
    return;
  }
  if (!isBase64(req.body.blindSignature)) {
    res.status(404).send({message: "Invalid blinded signature"});
    return;
  }

  const user = (req as any).user;
  if (!user) {
    res.status(400).send({
      message: "Not logged in!"
    });
    return;
  }
  if (!user.blindPreparedMsg || !user.blindInv) {
    res.status(404).send({message: "User must first init blind signing"});
    return;
  }
  next();
}

export const validate = {
  checkDuplicateEmail: checkDuplicateEmail,
  checkAnswer: checkAnswer,
  checkUserConfig: checkUserConfig,
  checkOidc: checkOidc,
  checkBlindInit: checkBlindInit,
  checkBlindConfig: checkBlindConfig,
  checkBlindFinalize: checkBlindFinalize,
  checkPoem: checkPoem
};


