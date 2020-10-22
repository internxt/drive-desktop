import crypto from 'crypto'

function hasher(input) {
  return crypto.createHash('ripemd160').update(input).digest('hex')
}

export default {
  hasher
}
