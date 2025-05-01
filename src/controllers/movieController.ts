import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { deleteFromS3, uploadToS3 } from '../lib/s3'

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

    const where: any = {
    }

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

    if (minBudget) {
      where.budget = { gte: Number(minBudget) }
    }

    
    if (maxBudget) {
      where.budget = { lte: Number(maxBudget) }
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

    res.json({ movies, total })
  } catch (err) {
    next(err)
  }
}

export async function getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = Number(req.params.id);

    const movie = await prisma.movie.findFirst({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      res.status(404).json({ error: 'Filme não encontrado' });
      return;
    }

    res.json(movie);
  } catch (err) {
    console.error('Erro ao buscar filme por ID:', err);
    next(err);
  }
}

export async function createMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, releaseDate, duration, budget } = req.body
    const file = req.file

    if (!title || !description || !releaseDate || !duration || !budget) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatórios' })
      return
    }

    let imageUrl: string | undefined = undefined

    if (file) {
      try {
        imageUrl = await uploadToS3(file)
      } catch (err) {
        console.error('Erro ao enviar imagem:', err)
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
    console.error('Erro inesperado ao criar filme:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro inesperado no servidor' })
    }
    next(err)
  }
}

export async function updateMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = Number(req.params.id);
    const { title, description, releaseDate, duration, budget } = req.body;
    const file = req.file;

    const movie = await prisma.movie.findFirst({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      res.status(404).json({ error: 'Filme não encontrado' });
      return;
    }

    let imageUrl = movie.image;

    if (file) {

      if (imageUrl) {
        try {
          await deleteFromS3(imageUrl);
        } catch (deleteError) {
          console.error('Erro ao deletar imagem antiga:', deleteError);
        }
      }

      try {
        imageUrl = await uploadToS3(file);
      } catch (uploadError) {
        console.error('Erro ao enviar nova imagem:', uploadError);
        res.status(500).json({ error: 'Erro ao enviar imagem' });
        return;
      }
    }

    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title,
        description,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        duration: duration ? Number(duration) : undefined,
        budget: budget ? Number(budget) : undefined,
        image: imageUrl,
      },
    });

    res.json(updatedMovie);
  } catch (err) {
    console.error('Erro ao editar filme:', err);
    next(err);
  }
}
