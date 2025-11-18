import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TagFilterItem } from '@/types/blog';

interface ITagSection {
  tags: TagFilterItem[];
  selectedTag: string;
}

export default function TagSection({ tags, selectedTag }: ITagSection) {
  return (
    <aside>
      <Card>
        <CardHeader>
          <CardTitle>태그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {tags.map((tag) => (
              <Link href={`?tag=${tag.name}`} key={tag.name}>
                <div
                  className={cn(
                    'hover:bg-muted-foreground/10 text-muted-foreground flex items-center justify-between rounded-md p-1.5 text-sm transition-colors',
                    selectedTag === tag.name && 'bg-muted-foreground/10 text-foreground font-medium'
                  )}
                >
                  <span>{tag.name}</span>
                  <span>{tag.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
