// src/routes/auth/auth.test.ts
import request from 'supertest'
import { Express } from 'express'
import { createServer } from '../../server'
import { prisma } from '../../lib/prisma'

describe('Auth Routes', () => {
  let app: Express

  beforeAll(() => {
    app = createServer()
  })

  beforeEach(async () => {
    // Limpa a tabela de usuários antes de cada teste
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(newUser)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('token')
      expect(response.body.name).toBe(newUser.name)
      expect(response.body.email).toBe(newUser.email)
      expect(response.body).not.toHaveProperty('password') // Não deve retornar a senha
    })

    it('deve retornar erro se o email já existe', async () => {
      const existingUser = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Password123!'
      }

      // Primeiro registro
      await request(app)
        .post('/auth/register')
        .send(existingUser)

      // Tentativa de registrar com o mesmo email
      const response = await request(app)
        .post('/auth/register')
        .send(existingUser)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Email já cadastrado')
    })

    it('deve validar campos obrigatórios', async () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email',
        password: '123' // senha muito curta
      }

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUser)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('deve validar formato de email', async () => {
      const userWithInvalidEmail = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userWithInvalidEmail)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('email inválido')
    })

    it('deve validar força da senha', async () => {
      const userWithWeakPassword = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // senha muito fraca
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userWithWeakPassword)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('senha deve ter')
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Cria um usuário para os testes de login
      await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!'
        })
    })

    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(loginData.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('deve falhar com email incorreto', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Email ou senha incorretos')
    })

    it('deve falhar com senha incorreta', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Email ou senha incorretos')
    })

    it('deve validar formato de email no login', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('email inválido')
    })

    it('deve requerer todos os campos', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
          // senha faltando
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('senha é obrigatória')
    })

    it('deve limitar tentativas de login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      // Tenta login várias vezes com senha errada
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send(loginData)
      }

      // Tenta mais uma vez
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(429)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Muitas tentativas')
    })
  })

  // Testes de segurança adicionais
  describe('Segurança', () => {
    it('não deve permitir SQL injection no login', async () => {
      const loginData = {
        email: "' OR '1'='1",
        password: "' OR '1'='1"
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(400)
    })

    it('deve usar HTTPS para cookies de sessão', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      if (response.headers['set-cookie']) {
        const cookie = response.headers['set-cookie'][0]
        expect(cookie).toContain('Secure')
        expect(cookie).toContain('HttpOnly')
      }
    })
  })
})