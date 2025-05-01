import express from 'express';
import { authMiddleware } from '../../middlewares/auth';
import {
  createMovie,
  listMovies,
  getMovieById,
  updateMovie,
} from '../../controllers/movieController';
import { upload } from '../../middlewares/upload';

const router = express.Router();

// Aplica o middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar filmes
router.get('/', listMovies);

// Criar novo filme
router.post('/', upload.single('image'), createMovie);

// Buscar filme por ID
router.get('/:id', getMovieById);

// Atualizar filme existente
router.put('/:id', upload.single('image'), updateMovie);

export default router;
