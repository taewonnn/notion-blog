export interface TagFIlterItem {
  id: string;
  name: string;
  count: number;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  tags?: TagFIlterItem[];
  author?: string;
  date?: string;
  modifiedDate?: string;
  slug: string;
}
