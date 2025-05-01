// src/routes/movies/route.test.ts
import request from 'supertest'
import { Express } from 'express'
import { createServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { generateToken } from '../../lib/jwt'

describe('Movie Routes', () => {
  let app: Express
  let authToken: string

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User'
  }

  beforeAll(() => {
    app = createServer()
    authToken = generateToken(mockUser)
  })

  beforeEach(async () => {
    // Limpa a tabela de filmes antes de cada teste
    await prisma.movie.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /movies', () => {
    it('deve retornar 401 sem token de autenticação', async () => {
      const response = await request(app)
        .get('/movies')

      expect(response.status).toBe(401)
    })

    it('deve retornar lista vazia quando não há filmes', async () => {
      const response = await request(app)
        .get('/movies')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        movies: [],
        total: 0
      })
    })

    it('deve retornar lista de filmes quando existem filmes', async () => {
      // Cria um filme de teste
      await prisma.movie.create({
        data: {
          title: 'Teste Movie',
          description: 'Test Description',
          releaseDate: new Date(),
          duration: 120,
          budget: 1000000
        }
      })

      const response = await request(app)
        .get('/movies')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.movies).toHaveLength(1)
      expect(response.body.movies[0].title).toBe('Teste Movie')
    })
  })

  describe('POST /movies', () => {
    it('deve criar um novo filme', async () => {
      const newMovie = {
        title: 'Novo Filme',
        description: 'Descrição do novo filme',
        releaseDate: new Date().toISOString(),
        duration: 120,
        budget: 1000000
      }

      const response = await request(app)
        .post('/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMovie)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe(newMovie.title)
    })

    it('deve retornar erro com dados inválidos', async () => {
      const invalidMovie = {
        title: '' // título vazio deve ser inválido
      }

      const response = await request(app)
        .post('/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMovie)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /movies/:id', () => {
    it('deve retornar um filme específico', async () => {
      const movie = await prisma.movie.create({
        data: {
          title: 'Filme Específico',
          description: 'Descrição do filme',
          releaseDate: new Date(),
          duration: 120,
          budget: 1000000
        }
      })

      const response = await request(app)
        .get(`/movies/${movie.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Filme Específico')
    })

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/movies/999999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})