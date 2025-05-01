import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Preencha todos os campos' })
      return
    }

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) {
      res.status(409).json({ error: 'E-mail já cadastrado' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    res.status(201).json({ message: 'Usuária registrada com sucesso', userId: user.id })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ error: 'Usuária não encontrada' })
      return
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      res.status(401).json({ error: 'Senha inválida' })
      return
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    })

    res.json({ token })
  } catch (err) {
    next(err)
  }
}
