import { z } from 'zod';
import { loginSchema, registerSchema } from '../modules/auth/auth.schemas.js';
import { createCommentSchema } from '../modules/comments/comments.schemas.js';
import { createPostSchema, updatePostSchema } from '../modules/posts/posts.schemas.js';

// Request bodies are generated from the same Zod schemas that validate them.
function fromZod(schema: z.ZodType) {
  const jsonSchema = z.toJSONSchema(schema, { io: 'input' });
  delete jsonSchema.$schema;
  return jsonSchema;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const object = (properties: Record<string, object>, required = Object.keys(properties)) => ({
  type: 'object',
  required,
  properties,
});

const jsonContent = (schema: object) => ({ 'application/json': { schema } });

const requestBody = (schemaName: string) => ({
  required: true,
  content: jsonContent(ref(schemaName)),
});

const success = (description: string, schema: object) => ({
  description,
  content: jsonContent(schema),
});

const failure = (name: string) => ({ $ref: `#/components/responses/${name}` });

const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ref('Error')),
});

const pathId = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const pageParams = [
  { $ref: '#/components/parameters/Page' },
  { $ref: '#/components/parameters/Limit' },
];

const secured = [{ cookieAuth: [] }];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Mini Blog API',
    version: '1.0.0',
    description:
      'Authentication uses an httpOnly cookie named `token`. Call `POST /auth/register` or ' +
      '`POST /auth/login` first. Your browser then sends the cookie automatically on "Try it out" ' +
      'requests.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Health' }, { name: 'Auth' }, { name: 'Posts' }, { name: 'Comments' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness check',
        responses: {
          '200': success(
            'API is running',
            object({
              status: { type: 'string', example: 'ok' },
              uptime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
            }),
          ),
        },
      },
    },
    '/health/db': {
      get: {
        tags: ['Health'],
        summary: 'Database connectivity check',
        responses: {
          '200': success(
            'Database reachable',
            object({
              status: { type: 'string', example: 'ok' },
              database: { type: 'string', example: 'up' },
            }),
          ),
          '503': success(
            'Database unreachable',
            object({
              status: { type: 'string', example: 'error' },
              database: { type: 'string', example: 'down' },
            }),
          ),
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account and start a session',
        requestBody: requestBody('RegisterRequest'),
        responses: {
          '201': {
            ...success('Account created', object({ user: ref('User') })),
            headers: {
              'Set-Cookie': {
                description: 'httpOnly session cookie `token`',
                schema: { type: 'string' },
              },
            },
          },
          '400': failure('BadRequest'),
          '409': errorResponse('Email already in use (EMAIL_TAKEN)'),
          '429': failure('TooManyRequests'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and start a session',
        requestBody: requestBody('LoginRequest'),
        responses: {
          '200': {
            ...success('Logged in', object({ user: ref('User') })),
            headers: {
              'Set-Cookie': {
                description: 'httpOnly session cookie `token`',
                schema: { type: 'string' },
              },
            },
          },
          '400': failure('BadRequest'),
          '401': errorResponse('Invalid email or password (INVALID_CREDENTIALS)'),
          '429': failure('TooManyRequests'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (clears the cookie)',
        responses: { '204': { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current user',
        security: secured,
        responses: {
          '200': success('Current user', object({ user: ref('User') })),
          '401': failure('Unauthorized'),
        },
      },
    },
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List published posts',
        parameters: pageParams,
        responses: {
          '200': success('A page of published posts, newest first', ref('PostList')),
          '400': failure('BadRequest'),
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a post',
        security: secured,
        requestBody: requestBody('CreatePostRequest'),
        responses: {
          '201': success('Post created', object({ post: ref('Post') })),
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
        },
      },
    },
    '/posts/mine': {
      get: {
        tags: ['Posts'],
        summary: 'List my posts, drafts included',
        security: secured,
        parameters: pageParams,
        responses: {
          '200': success('A page of my posts, newest first', ref('PostList')),
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
        },
      },
    },
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get a post',
        description: 'Drafts are visible only to their author. Everyone else gets a 404.',
        parameters: [pathId('id', 'Post id')],
        responses: {
          '200': success('The post', object({ post: ref('Post') })),
          '400': failure('BadRequest'),
          '404': failure('NotFound'),
        },
      },
      patch: {
        tags: ['Posts'],
        summary: 'Update my post',
        description: 'Send only the fields to change. At least one is required.',
        security: secured,
        parameters: [pathId('id', 'Post id')],
        requestBody: requestBody('UpdatePostRequest'),
        responses: {
          '200': success('Updated post', object({ post: ref('Post') })),
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
          '403': failure('Forbidden'),
          '404': failure('NotFound'),
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete my post and its comments',
        security: secured,
        parameters: [pathId('id', 'Post id')],
        responses: {
          '204': { description: 'Deleted' },
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
          '403': failure('Forbidden'),
          '404': failure('NotFound'),
        },
      },
    },
    '/posts/{postId}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List comments on a published post',
        parameters: [pathId('postId', 'Post id'), ...pageParams],
        responses: {
          '200': success('A page of comments, oldest first', ref('CommentList')),
          '400': failure('BadRequest'),
          '404': failure('NotFound'),
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Comment on a published post',
        security: secured,
        parameters: [pathId('postId', 'Post id')],
        requestBody: requestBody('CreateCommentRequest'),
        responses: {
          '201': success('Comment created', object({ comment: ref('Comment') })),
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
          '404': failure('NotFound'),
        },
      },
    },
    '/comments/{id}': {
      delete: {
        tags: ['Comments'],
        summary: 'Delete my comment',
        security: secured,
        parameters: [pathId('id', 'Comment id')],
        responses: {
          '204': { description: 'Deleted' },
          '400': failure('BadRequest'),
          '401': failure('Unauthorized'),
          '403': failure('Forbidden'),
          '404': failure('NotFound'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
    parameters: {
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number, starting at 1',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
      },
    },
    responses: {
      BadRequest: errorResponse('Validation failed or malformed JSON'),
      Unauthorized: errorResponse('Missing, invalid or expired session'),
      Forbidden: errorResponse('The resource belongs to another user'),
      NotFound: errorResponse('The resource does not exist, or is not visible to you'),
      TooManyRequests: errorResponse('Rate limit exceeded'),
    },
    schemas: {
      RegisterRequest: fromZod(registerSchema),
      LoginRequest: fromZod(loginSchema),
      CreatePostRequest: fromZod(createPostSchema),
      UpdatePostRequest: fromZod(updatePostSchema),
      CreateCommentRequest: fromZod(createCommentSchema),
      Error: object(
        {
          error: object(
            {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: object({ path: { type: 'string' }, message: { type: 'string' } }),
              },
            },
            ['code', 'message'],
          ),
        },
        ['error'],
      ),
      User: object({
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }),
      Author: object({
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
      }),
      PostSummary: object({
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        published: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        author: ref('Author'),
      }),
      Post: {
        allOf: [ref('PostSummary'), object({ content: { type: 'string' } })],
      },
      Comment: object({
        id: { type: 'string', format: 'uuid' },
        content: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        author: ref('Author'),
      }),
      PageMeta: object({
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      }),
      PostList: object({
        data: { type: 'array', items: ref('PostSummary') },
        meta: ref('PageMeta'),
      }),
      CommentList: object({
        data: { type: 'array', items: ref('Comment') },
        meta: ref('PageMeta'),
      }),
    },
  },
};
