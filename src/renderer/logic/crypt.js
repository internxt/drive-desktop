import CryptoJS from 'crypto-js'
import crypto from 'crypto'
import fs from 'fs'
import async from 'async'

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

function DeterministicEncryption (content, salt) {
  try {
    const key = CryptoJS.enc.Hex.parse(process.env.CRYPTO_SECRET)
    const iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key

    const encrypt = CryptoJS.AES.encrypt(content, key, { iv: iv }).toString()
    const b64 = CryptoJS.enc.Base64.parse(encrypt)
    const eHex = b64.toString(CryptoJS.enc.Hex)
    return eHex
  } catch (e) {
    return null
  }
}

function ProbabilisticEncryption (content) {
  try {
    const b64 = CryptoJS.AES.encrypt(content, process.env.CRYPTO_SECRET).toString()
    const e64 = CryptoJS.enc.Base64.parse(b64)
    const eHex = e64.toString(CryptoJS.enc.Hex)
    return eHex
  } catch (error) {
    return null
  }
}

function EncryptName (name, salt) {
  if (!salt) {
    // If no salt, somewhere is trying to use legacy encryption
    return ProbabilisticEncryption(name)
  } else {
    // If salt is provided, use new deterministic encryption
    return DeterministicEncryption(name, salt)
  }
}

function FileHash (path, hash) {
  return new Promise((resolve, reject) => {
    let hasher = crypto.createHash(hash || 'SHA256')
    let stream = fs.createReadStream(path)
    stream.on('data', function (data) {
      hasher.update(data)
    })
    stream.on('end', function () {
      resolve(hasher.digest('hex'))
    })
    stream.on('error', function (err) {
      reject(err)
    })
  })
}

function CompareHash (path1, path2, hash) {
  return new Promise((resolve, reject) => {
    async.parallel([
      (next) => {
        FileHash(path1, hash).then(result => next(null, result)).catch(err => next(err))
      },
      (next) => {
        FileHash(path2, hash).then(result => next(null, result)).catch(err => next(err))
      }
    ], function (err, results) {
      if (err) { reject(err) } else {
        resolve(results[0] === results[1])
      }
    })
  })
}

function EncryptFilename (fileName, folderId) {
  const extSeparatorPos = fileName.lastIndexOf('.')
  const fileNameNoExt = extSeparatorPos > 0 ? fileName.slice(0, extSeparatorPos) : fileName
  const encryptedFileName = EncryptName(fileNameNoExt, folderId + '')
  return encryptedFileName
}

export default {
  Encrypt,
  EncryptWithKey,
  Decrypt,
  DecryptWithKey,
  HashPassword,
  DeterministicDecryption,
  ProbabilisticDecryption,
  DecryptName,
  FileHash,
  CompareHash,
  EncryptFilename
}
