import { transporter } from './mailer'

export async function sendReleaseEmailToAll(users: { email: string }[], movies: { title: string }[], releaseDate: Date) {
  if (users.length === 0 || movies.length === 0) return

  const movieList = movies.map((m) => `• ${m.title}`).join('\n')

  const subject = `🎬 Estreias de hoje (${releaseDate.toLocaleDateString()})`
  const text = `Hoje estreiam os seguintes filmes:\n\n${movieList}`

  const sendPromises = users.map((user) =>
    transporter.sendMail({
      from: '"Filmes App" <no-reply@filmes.com>',
      to: user.email,
      subject,
      text,
    })
  )

  await Promise.all(sendPromises)

  console.log(`📧 E-mails enviados para ${users.length} usuários.`)
}
