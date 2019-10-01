import CryptoJS from 'crypto-js'

function EncryptWithKey (textToEncrypt, key) {
  const bytes = CryptoJS.AES.encrypt(textToEncrypt, key).toString()
  const text64 = CryptoJS.enc.Base64.parse(bytes)
  return text64.toString(CryptoJS.enc.Hex)
}

function Encrypt (textToEncrypt) {
  return EncryptWithKey(textToEncrypt, process.env.CRYPTO_SECRET)
}

function DecryptWithKey (cipherText, key) {
  const reb = CryptoJS.enc.Hex.parse(cipherText)
  const bytes = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

function Decrypt (cipherText) {
  return DecryptWithKey(cipherText, process.env.CRYPTO_SECRET)
}

function HashPassword (rawPassword, salt) {
  salt = salt ? CryptoJS.enc.Hex.parse(salt) : CryptoJS.lib.WordArray.random(128 / 8)
  const hash = CryptoJS.PBKDF2(rawPassword, salt, { keySize: 256 / 32, iterations: 10000 })
  return { hash, salt }
}

function DeterministicDecryption (cipherText, salt) {
  try {
    const key = CryptoJS.enc.Hex.parse(process.env.CRYPTO_SECRET)
    const iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key

    const reb64 = CryptoJS.enc.Hex.parse(cipherText)
    const bytes = reb64.toString(CryptoJS.enc.Base64)
    const decrypt = CryptoJS.AES.decrypt(bytes, key, { iv: iv })
    const plain = decrypt.toString(CryptoJS.enc.Utf8)

    return plain
  } catch (e) {
    return null
  }
}

function DecryptName (cipherText, salt) {
  if (!salt) {
    // If no salt, something is trying to use legacy decryption
    return ProbabilisticDecryption(cipherText)
  } else {
    // If salt is provided, we could have 2 scenarios

    // 1. The cipherText is truly encripted with salt in a deterministic way
    const decrypted = DeterministicDecryption(cipherText, salt)

    if (!decrypted) {
      // 2. The deterministic algorithm failed although salt were provided.
      // So, the cipherText is encrypted in a probabilistic way.

      return ProbabilisticDecryption(cipherText)
    } else {
      return decrypted
    }
  }
}

function ProbabilisticDecryption (cipherText) {
  try {
    const reb64 = CryptoJS.enc.Hex.parse(cipherText)
    const bytes = reb64.toString(CryptoJS.enc.Base64)
    const decrypt = CryptoJS.AES.decrypt(bytes, process.env.CRYPTO_SECRET)
    const plain = decrypt.toString(CryptoJS.enc.Utf8)
    return plain
  } catch (error) {
    return null
  }
}

export default {
  Encrypt,
  EncryptWithKey,
  Decrypt,
  DecryptWithKey,
  HashPassword,
  DeterministicDecryption,
  ProbabilisticDecryption,
  DecryptName
}
