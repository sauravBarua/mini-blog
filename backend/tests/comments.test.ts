import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { anonymous, createPost, randomId, resetDb, signUp } from './helpers.js';

beforeEach(resetDb);

describe('POST /posts/:postId/comments', () => {
  it('lets a logged-in user comment on a published post', async () => {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    const post = await createPost(alice);

    const res = await bob.post(`/posts/${post.id}/comments`).send({ content: 'Nice post!' });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('Nice post!');
    expect(res.body.comment.author.name).toBe('Bob');
  });

  it('requires authentication', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await anonymous().post(`/posts/${post.id}/comments`).send({ content: 'Hi' });

    expect(res.status).toBe(401);
  });

  it('rejects empty comments', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await agent.post(`/posts/${post.id}/comments`).send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('does not allow comments on drafts or unknown posts', async () => {
    const { agent } = await signUp('Alice');
    const draft = await createPost(agent, { published: false });

    const onDraft = await agent.post(`/posts/${draft.id}/comments`).send({ content: 'Hi' });
    const onUnknown = await agent.post(`/posts/${randomId()}/comments`).send({ content: 'Hi' });

    expect(onDraft.status).toBe(404);
    expect(onUnknown.status).toBe(404);
  });
});

describe('GET /posts/:postId/comments', () => {
  it('lists comments oldest first, with pagination metadata', async () => {
    const { agent, user } = await signUp('Alice');
    const post = await createPost(agent);
    const base = Date.now();
    for (const [index, content] of ['first', 'second', 'third'].entries()) {
      await prisma.comment.create({
        data: {
          content,
          postId: post.id,
          authorId: user.id,
          createdAt: new Date(base + index * 1000),
        },
      });
    }

    const res = await anonymous().get(`/posts/${post.id}/comments?limit=2`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((comment: { content: string }) => comment.content)).toEqual([
      'first',
      'second',
    ]);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('returns 404 for a draft post', async () => {
    const { agent } = await signUp('Alice');
    const draft = await createPost(agent, { published: false });

    const res = await anonymous().get(`/posts/${draft.id}/comments`);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /comments/:id', () => {
  async function commentByBob() {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    const post = await createPost(alice);
    const res = await bob.post(`/posts/${post.id}/comments`).send({ content: 'Bob was here' });
    return { alice, bob, post, commentId: res.body.comment.id as string };
  }

  it('lets the author delete their comment', async () => {
    const { bob, commentId } = await commentByBob();

    const res = await bob.delete(`/comments/${commentId}`);

    expect(res.status).toBe(204);
    expect(await prisma.comment.count()).toBe(0);
  });

  it('forbids deleting someone else’s comment, even on your own post', async () => {
    const { alice, commentId } = await commentByBob();

    const res = await alice.delete(`/comments/${commentId}`);

    expect(res.status).toBe(403);
    expect(await prisma.comment.count()).toBe(1);
  });

  it('returns 404 for an unknown comment', async () => {
    const { bob } = await commentByBob();

    const res = await bob.delete(`/comments/${randomId()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
  });

  it('is removed together with its post', async () => {
    const { alice, post } = await commentByBob();

    await alice.delete(`/posts/${post.id}`);

    expect(await prisma.comment.count()).toBe(0);
  });
});
