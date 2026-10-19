export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export type Author = {
  id: string;
  name: string;
};

export type PostSummary = {
  id: string;
  title: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
};

export type Post = PostSummary & { content: string };

export type PostInput = {
  title: string;
  content: string;
  published: boolean;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Page<T> = {
  data: T[];
  meta: PageMeta;
};
