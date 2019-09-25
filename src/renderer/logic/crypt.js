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

export default {
  Encrypt,
  EncryptWithKey,
  Decrypt,
  DecryptWithKey,
  HashPassword
}
