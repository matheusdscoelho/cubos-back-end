import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTodayReleases } from '../scheduler';
import { prisma } from '../prisma';
import { sendReleaseEmailToAll } from '../sendEmail';

vi.mock('../prisma', () => ({
  prisma: {
    movie: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock('../sendEmail', () => ({
  sendReleaseEmailToAll: vi.fn(),
}));

describe('checkTodayReleases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia email se houver filmes', async () => {
    const mockMovies = [
      {
        id: 1,
        title: 'Filme Teste',
        description: 'Descrição do Filme Teste',
        releaseDate: new Date('2024-01-01'),
        duration: 120,
        budget: 1000000,
        image: null,
        createdAt: new Date('2023-01-01'),
      },
    ];

    const mockUsers = [
      {
        id: 1,
        name: 'Test User',
        email: 'user@test.com',
        password: 'password123',
      },
    ];

    vi.mocked(prisma.movie.findMany).mockResolvedValue(mockMovies);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);
    vi.mocked(sendReleaseEmailToAll).mockResolvedValue(undefined);

    await checkTodayReleases(new Date('2024-01-01'));

    // Verifica se as funções foram chamadas com os parâmetros corretos
    expect(prisma.movie.findMany).toHaveBeenCalledWith({
      where: {
        releaseDate: {
          gte: expect.any(Date),
          lt: expect.any(Date),
        },
      },
      select: {
        title: true,
      },
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: { email: true },
      where: {
        email: {
          not: undefined,
        },
      },
    });

    expect(sendReleaseEmailToAll).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ email: 'user@test.com' })]),
      expect.arrayContaining([expect.objectContaining({ title: 'Filme Teste' })]),
      expect.any(Date),
    );
  });

  it('não envia email se não houver filmes', async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValue([]);

    const result = await checkTodayReleases(new Date('2024-01-01'));

    expect(prisma.movie.findMany).toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(sendReleaseEmailToAll).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('lida com erros ao buscar filmes', async () => {
    vi.mocked(prisma.movie.findMany).mockRejectedValue(new Error('Database error'));

    await expect(checkTodayReleases(new Date('2024-01-01'))).rejects.toThrow('Database error');
  });
});
