import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { startDailyReleaseChecker } from './lib/scheduler'

import authRoutes from './routes/auth'
import moviesRoutes from './routes/movies'
import testRoutes from './routes/test'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/movies', moviesRoutes)
app.use('/test', testRoutes)

startDailyReleaseChecker()

app.listen(3333, () => {
  console.log('🚀 Servidor rodando na porta 3333')
})
