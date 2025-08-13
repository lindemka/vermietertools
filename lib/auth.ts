import bcrypt from 'bcryptjs'
import { prisma } from './db'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    return null
  }
  
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    return null
  }
  
  return user
}
