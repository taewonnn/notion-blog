import { Post } from '@/types/blog';
import Link from 'next/link';
import { PostCard } from './PostCard';

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-4">
      {posts.map((post, index) => (
        <Link href={`/blog/${post.slug}`} key={post.id}>
          <PostCard post={post} isFirst={index === 0} />
        </Link>
      ))}
    </div>
  );
}
