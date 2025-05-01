import { createServer } from './server'
import { startDailyReleaseChecker } from './lib/scheduler'

const app = createServer()
const PORT = process.env.PORT || 3333

startDailyReleaseChecker()

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})