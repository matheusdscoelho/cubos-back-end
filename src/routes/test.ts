import express from 'express'
import { sendReleaseEmailToAll } from '../lib/sendEmail'

const router = express.Router()

router.post('/send-test-email', async (req, res) => {
  try {
    const users = [
      { email: 'matheuscoelho060@gmail.com' },
    ]

    const movies = [
      { title: 'Filme de Teste 1' },
      { title: 'Filme de Teste 2' },
    ]

    const today = new Date()

    await sendReleaseEmailToAll(users, movies, today)

    res.json({ message: 'E-mail de teste enviado com sucesso.' })
  } catch (err) {
    console.error('Erro ao enviar e-mail de teste:', err)
    res.status(500).json({ error: 'Erro ao enviar e-mail de teste.' })
  }
})

export default router
                                       