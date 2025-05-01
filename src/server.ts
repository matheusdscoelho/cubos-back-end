import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth/route'
import moviesRoutes from './routes/movies/route'
import testRoutes from './routes/test'

dotenv.config()

export function createServer() {
  const app = express()

  // Middlewares
  app.use(cors())
  app.use(express.json())

  // Routes
  app.use('/auth', authRoutes)
  app.use('/movies', moviesRoutes)
  app.use('/test', testRoutes)

  return app
}

export default createServer