import fetch from 'node-fetch';
import * as sshpk from 'sshpk';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { UserType } from "../models/user.model.js";
import { config as signer_config } from '../config/signer.config.js';
import { config as auth_config } from '../config/auth.config.js';

export const variants = [
    RSABSSA.SHA384.PSS.Randomized,
    RSABSSA.SHA384.PSS.Deterministic,
    RSABSSA.SHA384.PSSZero.Randomized,
    RSABSSA.SHA384.PSSZero.Deterministic,
];

export function getRsaVariant(rsaVariant: number) {
  return variants[rsaVariant % variants.length];
}

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#examples
export async function importRsaKey(pem: string) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length - 1,
    );
    // base64 decode the string to get the binary data
    const binaryDerString = atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
  
    return await crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-PSS",
        hash: "SHA-384",
      },
      true,
      ["verify"],
    );
}

export async function importPrivateKey(pem: string) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length - 1,
    );
    // base64 decode the string to get the binary data
    const binaryDerString = atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
  
    return await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-PSS",
        hash: "SHA-384",
      },
      true,
      ["sign"],
    );
}

export async function getPubkey(user: UserType): Promise<string> {
  const encodedUsername = encodeURIComponent(user.oidcUser);
  if (!encodedUsername) {
    throw new Error("OIDC user not configured");
  }

  var headers: Record<string, string> = {
    'User-Agent': 'TrustedBlinding',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (auth_config.github_token) {
    headers['Authorization'] = `Bearer ${auth_config.github_token}`
  } else {
    console.log('Configure GitHub token!')
  }

  // https://docs.github.com/en/rest/users/ssh-signing-keys?apiVersion=2022-11-28#list-ssh-signing-keys-for-the-authenticated-user
  const response = await fetch(`https://api.github.com/users/${encodedUsername}/ssh_signing_keys`, { 
    headers: headers  
  });

  // Check if the fetch was successful
  if (!response.ok) {
    var msg = "";
    try {
      msg = (await response.json() as any).message;
      if (!msg)
        msg = "";
    } catch(err) {}
    throw new Error(`HTTP error from GitHub! status: ${response.status}, msg: ${msg}`);
  }

  const keys: any = await response.json();
  const filteredKeys = keys.filter((key: any) => 
      key.key
      && key.title
      && key.key.startsWith('ssh-rsa ')
      && key.title == user.oidcKey
  );

  if (filteredKeys.length <= 0) {
      throw new Error('No valid RSA keys found for the user');
  }

  const theKey = filteredKeys[0].key as string;
  if (theKey.length > 2048) {
    throw new Error('RSA key too long, max 2048 bytes of encoded key')
  }

  let key = sshpk.parseKey(theKey, 'ssh');
  if (key.size > 4096) {
    throw new Error('RSA key too large, max 4096 bits');
  }
  return theKey;
}

export function encode(data: Uint8Array) {
    const output = [];
    for (let i = 0; i < data.length; i++)
        output.push(String.fromCharCode(data[i]));
    return btoa(output.join(''));
}

export function decode(data: string) {
    return Uint8Array.from(atob(data), c=>c.charCodeAt(0))
}

export async function signPoem(poem: string, type: number): Promise<any> {
  const data = JSON.stringify({ poem: poem, type: type });

  const response = await fetch(`http://${signer_config.HOST}:${signer_config.PORT}/sign`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: data
  });

  if (!response.ok) {
      throw new Error(`signer returned ${response.status}`);
  }

  const parsedResponse: any = await response.json();
  if (!parsedResponse.signedPoem || parsedResponse.canPublish == undefined) {
      var error = "unknown error";
      if (parsedResponse.error)
          error = parsedResponse.error;
      throw new Error(error);
  }
  return parsedResponse;
}
