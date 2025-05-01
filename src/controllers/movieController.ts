import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { deleteFromS3, uploadToS3 } from '../lib/s3'

// LISTAR FILMES
export async function listMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      search,
      durationMin,
      durationMax,
      dateStart,
      dateEnd,
      minBudget,
      maxBudget,
      page = '1',
      limit = '10',
    } = req.query

    const where: any = {}

    if (search) {
      where.title = { contains: String(search), mode: 'insensitive' }
    }

    if (durationMin || durationMax) {
      where.duration = {}
      if (durationMin) where.duration.gte = Number(durationMin)
      if (durationMax) where.duration.lte = Number(durationMax)
    }

    if (dateStart || dateEnd) {
      where.releaseDate = {}
      if (dateStart) where.releaseDate.gte = new Date(String(dateStart))
      if (dateEnd) where.releaseDate.lte = new Date(String(dateEnd))
    }

    if (minBudget || maxBudget) {
      where.budget = {}
      if (minBudget) where.budget.gte = Number(minBudget)
      if (maxBudget) where.budget.lte = Number(maxBudget)
    }

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        orderBy: { releaseDate: 'desc' },
        skip,
        take,
      }),
      prisma.movie.count({ where }),
    ])

    res.status(200).json({ movies, total })
  } catch (err) {
    next(err)
  }
}

// BUSCAR FILME POR ID
export async function getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = Number(req.params.id)
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    })

    if (!movie) {
      res.status(404).json({ error: 'Filme não encontrado' })
      return
    }

    res.status(200).json(movie)
  } catch (err) {
    next(err)
  }
}

// CRIAR FILME
export async function createMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, releaseDate, duration, budget } = req.body
    const file = req.file

    // Validação de campos obrigatórios
    if (!title || !description || !releaseDate || !duration || !budget) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatórios' })
      return
    }

    // Validação de tipos
    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      isNaN(Date.parse(releaseDate)) ||
      isNaN(Number(duration)) ||
      isNaN(Number(budget))
    ) {
      res.status(400).json({ error: 'Dados inválidos' })
      return
    }

    let imageUrl: string | undefined = undefined

    if (file) {
      try {
        imageUrl = await uploadToS3(file)
      } catch (err) {
        res.status(500).json({ error: 'Erro ao enviar imagem' })
        return
      }
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        releaseDate: new Date(releaseDate),
        duration: Number(duration),
        budget: Number(budget),
        image: imageUrl,
      },
    })

    res.status(201).json(movie)
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro inesperado no servidor' })
    }
    next(err)
  }
}

// ATUALIZAR FILME
export async function updateMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = Number(req.params.id)
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const { title, description, releaseDate, duration, budget } = req.body
    const file = req.file

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    })

    if (!movie) {
      res.status(404).json({ error: 'Filme não encontrado' })
      return
    }

    let imageUrl = movie.image

    if (file) {
      if (imageUrl) {
        try {
          await deleteFromS3(imageUrl)
        } catch (deleteError) {
          // Não bloqueia a atualização se falhar ao deletar imagem antiga
        }
      }
      try {
        imageUrl = await uploadToS3(file)
      } catch (uploadError) {
        res.status(500).json({ error: 'Erro ao enviar imagem' })
        return
      }
    }

    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title: title ?? movie.title,
        description: description ?? movie.description,
        releaseDate: releaseDate ? new Date(releaseDate) : movie.releaseDate,
        duration: duration ? Number(duration) : movie.duration,
        budget: budget ? Number(budget) : movie.budget,
        image: imageUrl,
      },
    })

    res.status(200).json(updatedMovie)
  } catch (err) {
    next(err)
  }
}