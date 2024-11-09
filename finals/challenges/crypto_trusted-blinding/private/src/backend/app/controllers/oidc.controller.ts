import { RequestHandler } from "express";
import * as sshpk from 'sshpk';
import { getRsaVariant, importRsaKey, encode, decode, signPoem } from "./utils.js";

export const blindConfig: RequestHandler = async (req, res) => {
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
}

export const blindInit: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    if (req.body.type == undefined) {
      req.body.type = 0;
    }

    const suite = getRsaVariant(user.blindRsaVariant)();

    const theKey = sshpk.parseKey(user.publicKey, 'ssh')
    const key = await importRsaKey(theKey.toString('pem'))

    var signPoemResp
    try {
      signPoemResp = await signPoem(user.poem, req.body.type);
    } catch(err) {
      var errorMessage = "error";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      return res.status(404).send({message: errorMessage});
    }
    const signedPoem = signPoemResp.signedPoem;
    const canPublish = signPoemResp.canPublish;

    const message = new TextEncoder().encode(signedPoem);
    const preparedMsg = suite.prepare(message);
    let { blindedMsg, inv } = await suite.blind(key, preparedMsg);

    const preparedMsgE = encode(preparedMsg);
    const invE = encode(inv);
    if (preparedMsgE.length >= 1412 || invE.length >= 6827) {
      return res.status(404).send({message: "blinded data is too large, try again with smaller key"});
    }

    await user.update({
      signature: "",
      blindPreparedMsg: preparedMsgE,
      blindInv: invE,
      canPublish: canPublish
    });
    await user.save();

    return res.status(200).send({"blindedMsg": encode(blindedMsg)});
  } catch(err) {
    var errorMessage = "error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return res.status(404).send({message: errorMessage});
  }
};

export const blindFinalize: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(400).send({message: "Not logged in"});
      return;
    }

    const theKey = sshpk.parseKey(user.publicKey, 'ssh')
    const key = await importRsaKey(theKey.toString('pem'))

    const blindSignature = decode(req.body.blindSignature);
    const preparedMsg = decode(user.blindPreparedMsg);
    const inv = decode(user.blindInv);

    const suite = getRsaVariant(user.blindRsaVariant)();

    const signature = await suite.finalize(key, preparedMsg, blindSignature, inv);

    await user.update({
      preparedMsg: "",
      blindInv: "",
      signature: encode(signature)
    });
    await user.save();

    return res.status(200).send({signature: encode(signature)});
  } catch(err) {
    var errorMessage = "error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return res.status(404).send({message: errorMessage});
  }
};
