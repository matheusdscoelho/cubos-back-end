import cron from 'node-cron';
import { prisma } from './prisma';
import { sendReleaseEmailToAll } from './sendEmail';

export async function checkTodayReleases(date: Date = new Date()) {
  try {
    console.log(`Verificando estreias para: ${date.toISOString()}`);
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
    });

    if (movies.length === 0) {
      console.log('📭 Nenhuma estreia hoje.');
      return null;
    }

    const users = await prisma.user.findMany({
      select: { email: true },
      where: {
        email: {
          not: undefined,
        },
      },
    });

    console.log(`Encontrados ${movies.length} filmes para estreia`);
    console.log(`Encontrados ${users.length} usuários para notificar`);

    return await sendReleaseEmailToAll(users, movies, today);
  } catch (error) {
    console.error('Erro ao verificar estreias:', error);
    throw error;
  }
}

export function startDailyReleaseChecker() {
  return cron.schedule('11 0 * * *', async () => {
    const timeout = setTimeout(
      () => {
        console.error('Timeout ao verificar estreias');
      },
      5 * 60 * 1000,
    );

    try {
      await checkTodayReleases();
    } finally {
      clearTimeout(timeout);
    }
  });
}
