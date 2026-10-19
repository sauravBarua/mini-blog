import { apiFetch } from './api';
import type { Comment, Post, PostInput } from './types';

export const POSTS_PAGE_SIZE = 10;
export const COMMENTS_PAGE_SIZE = 20;

export const postsPath = (page: number) => `/posts?page=${page}&limit=${POSTS_PAGE_SIZE}`;
export const myPostsPath = (page: number) => `/posts/mine?page=${page}&limit=${POSTS_PAGE_SIZE}`;
export const postPath = (id: string) => `/posts/${id}`;
export const commentsPath = (postId: string, page: number) =>
  `/posts/${postId}/comments?page=${page}&limit=${COMMENTS_PAGE_SIZE}`;

export async function createPost(input: PostInput): Promise<Post> {
  const { post } = await apiFetch<{ post: Post }>('/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return post;
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  const { post } = await apiFetch<{ post: Post }>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return post;
}

export function deletePost(id: string): Promise<void> {
  return apiFetch<void>(`/posts/${id}`, { method: 'DELETE' });
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  const { comment } = await apiFetch<{ comment: Comment }>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return comment;
}

export function deleteComment(id: string): Promise<void> {
  return apiFetch<void>(`/comments/${id}`, { method: 'DELETE' });
}
