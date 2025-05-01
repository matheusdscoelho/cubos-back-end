// lib/scheduler.ts
import cron from 'node-cron'
import { prisma } from './prisma'
import { sendReleaseEmailToAll } from './sendEmail'

export function startDailyReleaseChecker() {
  cron.schedule('10 0 * * *', async () => {
    console.log('🔍 Verificando estreias de hoje...')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const movies = await prisma.movie.findMany({
      where: {
        releaseDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        title: true,
      },
    })

    if (movies.length === 0) {
      console.log('📭 Nenhuma estreia hoje.')
      return
    }

    const users = await prisma.user.findMany({
      select: { email: true },
      where: {
        email: {
          not: undefined,
        },
      },
    })

    await sendReleaseEmailToAll(users, movies, today)
  })
}
