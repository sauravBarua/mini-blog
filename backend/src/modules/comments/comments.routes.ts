import { Router } from 'express';
import { paginationSchema } from '../../lib/pagination.js';
import { idParamSchema } from '../../lib/params.js';
import { authenticate, getAuthUserId } from '../../middleware/authenticate.js';
import { createCommentSchema, postIdParamSchema } from './comments.schemas.js';
import { createComment, deleteComment, listComments } from './comments.service.js';

export const commentsRouter = Router();

commentsRouter.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = postIdParamSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  res.status(200).json(await listComments(postId, pagination));
});

commentsRouter.post('/posts/:postId/comments', authenticate, async (req, res) => {
  const { postId } = postIdParamSchema.parse(req.params);
  const input = createCommentSchema.parse(req.body);
  const comment = await createComment(postId, getAuthUserId(res), input);
  res.status(201).json({ comment });
});

commentsRouter.delete('/comments/:id', authenticate, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await deleteComment(id, getAuthUserId(res));
  res.status(204).send();
});
