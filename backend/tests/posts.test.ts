import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { anonymous, createPost, randomId, resetDb, signUp } from './helpers.js';

beforeEach(resetDb);

// Explicit timestamps keep the ordering deterministic.
async function seedPublished(authorId: string, titles: string[]) {
  const base = Date.now();
  for (const [index, title] of titles.entries()) {
    await prisma.post.create({
      data: {
        title,
        content: 'content',
        published: true,
        authorId,
        createdAt: new Date(base + index * 1000),
      },
    });
  }
}

describe('POST /posts', () => {
  it('requires authentication', async () => {
    const res = await anonymous().post('/posts').send({ title: 'Nope', content: 'Nope' });

    expect(res.status).toBe(401);
  });

  it('creates a draft owned by the logged-in user, ignoring a spoofed author', async () => {
    const { agent, user } = await signUp('Alice');

    const res = await agent
      .post('/posts')
      .send({ title: 'Hello', content: 'World', authorId: randomId() });

    expect(res.status).toBe(201);
    expect(res.body.post).toMatchObject({ title: 'Hello', content: 'World', published: false });
    expect(res.body.post.author).toEqual({ id: user.id, name: 'Alice' });
  });

  it('rejects invalid input', async () => {
    const { agent } = await signUp('Alice');

    const res = await agent.post('/posts').send({ title: '', content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /posts', () => {
  it('lists only published posts, without their content', async () => {
    const { agent } = await signUp('Alice');
    await createPost(agent, { title: 'Public', published: true });
    await createPost(agent, { title: 'Secret draft', published: false });

    const res = await anonymous().get('/posts');

    expect(res.status).toBe(200);
    expect(res.body.data.map((post: { title: string }) => post.title)).toEqual(['Public']);
    expect(res.body.data[0]).not.toHaveProperty('content');
  });

  it('orders newest first and paginates', async () => {
    const { user } = await signUp('Alice');
    await seedPublished(user.id, ['First', 'Second', 'Third']);

    const pageOne = await anonymous().get('/posts?page=1&limit=2');
    const pageTwo = await anonymous().get('/posts?page=2&limit=2');

    const titles = (res: { body: { data: { title: string }[] } }) =>
      res.body.data.map((post) => post.title);
    expect(titles(pageOne)).toEqual(['Third', 'Second']);
    expect(titles(pageTwo)).toEqual(['First']);
    expect(pageTwo.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects invalid pagination', async () => {
    const tooSmall = await anonymous().get('/posts?limit=0');
    const tooBig = await anonymous().get('/posts?limit=100');

    expect(tooSmall.status).toBe(400);
    expect(tooBig.status).toBe(400);
  });
});

describe('GET /posts/mine', () => {
  it('requires authentication', async () => {
    const res = await anonymous().get('/posts/mine');

    expect(res.status).toBe(401);
  });

  it('returns only my posts, drafts included', async () => {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    await createPost(alice, { title: 'Alice public', published: true });
    await createPost(alice, { title: 'Alice draft', published: false });
    await createPost(bob, { title: 'Bob public', published: true });

    const res = await alice.get('/posts/mine');

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((post: { title: string }) => post.title).sort()).toEqual([
      'Alice draft',
      'Alice public',
    ]);
  });
});

describe('GET /posts/:id', () => {
  it('returns a published post with its content to anyone', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent, { content: 'Full text' });

    const res = await anonymous().get(`/posts/${post.id}`);

    expect(res.status).toBe(200);
    expect(res.body.post.content).toBe('Full text');
  });

  it('shows a draft only to its author', async () => {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    const draft = await createPost(alice, { published: false });

    const asOwner = await alice.get(`/posts/${draft.id}`);
    const asOther = await bob.get(`/posts/${draft.id}`);
    const asAnonymous = await anonymous().get(`/posts/${draft.id}`);

    expect(asOwner.status).toBe(200);
    expect(asOther.status).toBe(404);
    expect(asAnonymous.status).toBe(404);
    expect(asAnonymous.body.error.code).toBe('POST_NOT_FOUND');
  });

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    const malformed = await anonymous().get('/posts/not-a-uuid');
    const unknown = await anonymous().get(`/posts/${randomId()}`);

    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });
});

describe('PATCH /posts/:id', () => {
  it('updates only the fields that were sent', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent, { published: true });

    const res = await agent.patch(`/posts/${post.id}`).send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe('New title');
    expect(res.body.post.published).toBe(true);
  });

  it('rejects an empty update', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await agent.patch(`/posts/${post.id}`).send({});

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await anonymous().patch(`/posts/${post.id}`).send({ title: 'Nope' });

    expect(res.status).toBe(401);
  });

  it('forbids editing someone else’s post', async () => {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    const post = await createPost(alice, { title: 'Original' });

    const res = await bob.patch(`/posts/${post.id}`).send({ title: 'Hacked' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    const stored = await prisma.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(stored.title).toBe('Original');
  });

  it('returns 404 for an unknown post', async () => {
    const { agent } = await signUp('Alice');

    const res = await agent.patch(`/posts/${randomId()}`).send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /posts/:id', () => {
  it('lets the owner delete the post', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await agent.delete(`/posts/${post.id}`);
    expect(res.status).toBe(204);

    const after = await anonymous().get(`/posts/${post.id}`);
    expect(after.status).toBe(404);
  });

  it('forbids deleting someone else’s post', async () => {
    const { agent: alice } = await signUp('Alice');
    const { agent: bob } = await signUp('Bob');
    const post = await createPost(alice);

    const res = await bob.delete(`/posts/${post.id}`);

    expect(res.status).toBe(403);
    expect(await prisma.post.count()).toBe(1);
  });

  it('requires authentication', async () => {
    const { agent } = await signUp('Alice');
    const post = await createPost(agent);

    const res = await anonymous().delete(`/posts/${post.id}`);

    expect(res.status).toBe(401);
  });
});
