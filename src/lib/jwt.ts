import jwt from 'jsonwebtoken'

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'default-secret'

export function generateToken(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET)
}