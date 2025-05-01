// lib/__tests__/sendEmail.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendReleaseEmailToAll } from '../sendEmail'
import { transporter } from '../mailer'
import { SentMessageInfo } from 'nodemailer'

// Mock do transporter
vi.mock('../mailer', () => ({
  transporter: {
    sendMail: vi.fn(),
  },
}))

describe('sendReleaseEmailToAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve enviar emails quando não há usuários', async () => {
    const users: { email: string }[] = []
    const movies = [{ title: 'Filme 1' }]
    const releaseDate = new Date('2024-01-01')

    await sendReleaseEmailToAll(users, movies, releaseDate)

    expect(transporter.sendMail).not.toHaveBeenCalled()
  })

  it('não deve enviar emails quando não há filmes', async () => {
    const users = [{ email: 'test@example.com' }]
    const movies: { title: string }[] = []
    const releaseDate = new Date('2024-01-01')

    await sendReleaseEmailToAll(users, movies, releaseDate)

    expect(transporter.sendMail).not.toHaveBeenCalled()
  })

  it('deve enviar emails corretamente para múltiplos usuários', async () => {
    const users = [
      { email: 'user1@example.com' },
      { email: 'user2@example.com' },
    ]
    const movies = [
      { title: 'Filme 1' },
      { title: 'Filme 2' },
    ]
    
    // Ajustando a data para meio-dia para evitar problemas de fuso horário
    const releaseDate = new Date('2024-01-01T12:00:00.000Z')

    // Mock da função sendMail para retornar uma Promise resolvida
    vi.mocked(transporter.sendMail).mockResolvedValue({} as any)

    await sendReleaseEmailToAll(users, movies, releaseDate)

    // Verifica se sendMail foi chamado para cada usuário
    expect(transporter.sendMail).toHaveBeenCalledTimes(2)

    // Função auxiliar para criar o texto esperado
    const expectedText = 'Hoje estreiam os seguintes filmes:\n\n• Filme 1\n• Filme 2'

    // Verifica o conteúdo do email para o primeiro usuário
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: '"Filmes App" <no-reply@filmes.com>',
      to: 'user1@example.com',
      subject: expect.stringMatching(/🎬 Estreias de hoje \(\d{1,2}\/\d{1,2}\/\d{4}\)/),
      text: expectedText,
    })

    // Verifica o conteúdo do email para o segundo usuário
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: '"Filmes App" <no-reply@filmes.com>',
      to: 'user2@example.com',
      subject: expect.stringMatching(/🎬 Estreias de hoje \(\d{1,2}\/\d{1,2}\/\d{4}\)/),
      text: expectedText,
    })
})
  it('deve lidar com erros no envio de email', async () => {
    const users = [{ email: 'test@example.com' }]
    const movies = [{ title: 'Filme 1' }]
    const releaseDate = new Date('2024-01-01')

    // Mock da função sendMail para simular um erro
    vi.mocked(transporter.sendMail).mockRejectedValue(new Error('Erro no envio'))

    // Verifica se a função lança um erro
    await expect(
      sendReleaseEmailToAll(users, movies, releaseDate)
    ).rejects.toThrow('Erro no envio')
  })

  it('deve formatar corretamente a lista de filmes no email', async () => {
    const users = [{ email: 'test@example.com' }]
    const movies = [
      { title: 'Filme 1' },
      { title: 'Filme 2' },
      { title: 'Filme 3' },
    ]
    const releaseDate = new Date('2024-01-01')

    vi.mocked(transporter.sendMail).mockResolvedValue({} as any)

    await sendReleaseEmailToAll(users, movies, releaseDate)

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'Hoje estreiam os seguintes filmes:\n\n• Filme 1\n• Filme 2\n• Filme 3'
        ),
      })
    )
  })

  // Teste para verificar o log
  it('deve logar o número de emails enviados', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const users = [
      { email: 'user1@example.com' },
      { email: 'user2@example.com' },
    ]
    const movies = [{ title: 'Filme 1' }]
    const releaseDate = new Date('2024-01-01')

    vi.mocked(transporter.sendMail).mockResolvedValue({} as any)

    await sendReleaseEmailToAll(users, movies, releaseDate)

    expect(consoleSpy).toHaveBeenCalledWith(
      '📧 E-mails enviados para 2 usuários.'
    )

    consoleSpy.mockRestore()
  })

  // Teste para verificar o comportamento com Promise.all
  it('deve enviar todos os emails em paralelo', async () => {
    const users = Array.from({ length: 5 }, (_, i) => ({
      email: `user${i}@example.com`,
    }))
    const movies = [{ title: 'Filme 1' }]
    const releaseDate = new Date('2024-01-01')

    const sendMailPromises: Promise<any>[] = []
    vi.mocked(transporter.sendMail).mockImplementation(() => {
      const promise = new Promise<SentMessageInfo>((resolve) =>
        setTimeout(() => resolve({} as SentMessageInfo), 100)
      )
      sendMailPromises.push(promise)
      return promise
    })

    const startTime = Date.now()
    await sendReleaseEmailToAll(users, movies, releaseDate)
    const endTime = Date.now()

    // Verifica se todos os emails foram enviados
    expect(transporter.sendMail).toHaveBeenCalledTimes(5)

    // Verifica se o tempo total é menor que o tempo individual multiplicado pelo número de emails
    // (indicando que foram enviados em paralelo)
    expect(endTime - startTime).toBeLessThan(500) // 5 * 100ms
  })
})