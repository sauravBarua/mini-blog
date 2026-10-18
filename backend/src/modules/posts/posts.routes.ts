import { Router } from 'express';
import { paginationSchema } from '../../lib/pagination.js';
import { idParamSchema } from '../../lib/params.js';
import {
  authenticate,
  getAuthUserId,
  getOptionalAuthUserId,
  optionalAuthenticate,
} from '../../middleware/authenticate.js';
import { createPostSchema, updatePostSchema } from './posts.schemas.js';
import {
  createPost,
  deletePost,
  getPostForViewer,
  listPostsByAuthor,
  listPublishedPosts,
  updatePost,
} from './posts.service.js';

export const postsRouter = Router();

postsRouter.get('/', async (req, res) => {
  const pagination = paginationSchema.parse(req.query);
  res.status(200).json(await listPublishedPosts(pagination));
});

// Must be declared before '/:id', otherwise "mine" is treated as an id.
postsRouter.get('/mine', authenticate, async (req, res) => {
  const pagination = paginationSchema.parse(req.query);
  res.status(200).json(await listPostsByAuthor(getAuthUserId(res), pagination));
});

postsRouter.get('/:id', optionalAuthenticate, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const post = await getPostForViewer(id, getOptionalAuthUserId(res));
  res.status(200).json({ post });
});

postsRouter.post('/', authenticate, async (req, res) => {
  const input = createPostSchema.parse(req.body);
  const post = await createPost(getAuthUserId(res), input);
  res.status(201).json({ post });
});

postsRouter.patch('/:id', authenticate, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updatePostSchema.parse(req.body);
  const post = await updatePost(getAuthUserId(res), id, input);
  res.status(200).json({ post });
});

postsRouter.delete('/:id', authenticate, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await deletePost(getAuthUserId(res), id);
  res.status(204).send();
});
