'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Notice } from '@/components/feedback';
import { FormField, TextAreaField } from '@/components/form-field';
import { noErrors, toFormErrors, type FormErrors } from '@/lib/form-errors';
import { createPost, updatePost } from '@/lib/posts-api';
import type { Post, PostInput } from '@/lib/types';
import { primaryButton, secondaryButton } from '@/lib/ui';

// Creates a post, or edits `post` when one is passed.
export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>(noErrors);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: PostInput = {
      title: String(data.get('title')),
      content: String(data.get('content')),
      published: data.get('published') === 'on',
    };

    setErrors(noErrors);
    setSubmitting(true);

    try {
      const saved = post ? await updatePost(post.id, input) : await createPost(input);
      router.push(`/posts/${saved.id}`);
    } catch (error) {
      setErrors(toFormErrors(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <FormField
        id="title"
        name="title"
        label="Title"
        required
        maxLength={200}
        defaultValue={post?.title}
        error={errors.fields.title}
      />
      <TextAreaField
        id="content"
        name="content"
        label="Content"
        required
        rows={14}
        maxLength={50000}
        defaultValue={post?.content}
        error={errors.fields.content}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? false}
          className="h-4 w-4"
        />
        Publish (visible to everyone)
      </label>
      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Saving…' : post ? 'Save changes' : 'Create post'}
        </button>
        <Link href={post ? `/posts/${post.id}` : '/my-posts'} className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
