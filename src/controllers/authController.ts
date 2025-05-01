// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Validações
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/

// Rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body

    // Validação de campos obrigatórios
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' })
      return
    }

    // Validação de nome
    if (name.trim().length < 2) {
      res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' })
      return
    }

    // Validação de email
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Formato de email inválido' })
      return
    }

    // Validação de senha
    if (!PASSWORD_REGEX.test(password)) {
      res.status(400).json({ 
        error: 'A senha deve ter pelo menos 8 caracteres, incluindo letras, números e caracteres especiais' 
      })
      return
    }

    // Verifica se email já existe
    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) {
      res.status(400).json({ error: 'Email já cadastrado' })
      return
    }

    // Cria o hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Cria o usuário
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword 
      }
    })

    // Gera o token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    // Remove a senha antes de enviar
    const { password: _, ...userWithoutPassword } = user

    // Retorna os dados do usuário e o token
    res.status(201).json({
      ...userWithoutPassword,
      token
    })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body

    // Validação de campos obrigatórios
    if (!email || !password) {
      res.status(400).json({ 
        error: email ? 'A senha é obrigatória' : 'O email é obrigatório' 
      })
      return
    }

    // Validação de formato de email
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Formato de email inválido' })
      return
    }

    // Verifica tentativas de login
    const attempts = loginAttempts.get(email)
    if (attempts) {
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeElapsed = Date.now() - attempts.lastAttempt
        if (timeElapsed < LOCKOUT_TIME) {
          res.status(429).json({ 
            error: 'Muitas tentativas. Tente novamente mais tarde.' 
          })
          return
        }
        loginAttempts.delete(email)
      }
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({ where: { email } })

    // Verifica se o usuário existe e a senha está correta
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Incrementa tentativas de login
      const currentAttempts = loginAttempts.get(email) || { count: 0, lastAttempt: Date.now() }
      loginAttempts.set(email, {
        count: currentAttempts.count + 1,
        lastAttempt: Date.now()
      })

      res.status(401).json({ error: 'Email ou senha incorretos' })
      return
    }

    // Reset tentativas de login após sucesso
    loginAttempts.delete(email)

    // Gera o token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    // Remove a senha antes de enviar
    const { password: _, ...userWithoutPassword } = user

    // Retorna os dados do usuário e o token
    res.json({
      user: userWithoutPassword,
      token
    })
  } catch (err) {
    next(err)
  }
}