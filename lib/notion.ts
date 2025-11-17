import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  UserObjectResponse,
  PartialUserObjectResponse,
  GroupObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { Post } from '@/types/blog';

const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03',
});

const getPlainText = (richText?: Array<{ plain_text?: string }>) => {
  if (!richText?.length) return undefined;
  const text = richText
    .map((item) => item.plain_text ?? '')
    .join('')
    .trim();
  return text || undefined;
};

const getCoverImage = (page: PageObjectResponse) => {
  if (!page.cover) return undefined;
  if (page.cover.type === 'external') return page.cover.external.url;
  if (page.cover.type === 'file') return page.cover.file.url;
  return undefined;
};

// 그룹이 아닌 사용자만 추출
const getFirstPerson = (list?: Array<UserObjectResponse | PartialUserObjectResponse | GroupObjectResponse>) => {
  if (!list?.length) return undefined;
  const person = list.find((item) => item.object === 'user');
  return person as UserObjectResponse | PartialUserObjectResponse | undefined;
};

const getUserName = (user?: UserObjectResponse | PartialUserObjectResponse) => {
  if (!user) return undefined;
  return 'name' in user && typeof user.name === 'string' ? user.name || undefined : undefined;
};

const mapPageToPost = (page: PageObjectResponse): Post => {
  const props = page.properties;

  const title = props.Title?.type === 'title' ? getPlainText(props.Title.title) : undefined;

  const description = props.Description?.type === 'rich_text' ? getPlainText(props.Description.rich_text) : undefined;

  const tags = props.Tags?.type === 'multi_select' ? props.Tags.multi_select.map((tag) => tag.name).filter(Boolean) : [];

  const author = props.Author?.type === 'people' ? getUserName(getFirstPerson(props.Author.people)) : undefined;

  const date = props.Date?.type === 'date' ? (props.Date.date?.start ?? undefined) : undefined;

  const modifiedDate = props['Modified Date']?.type === 'date' ? (props['Modified Date'].date?.start ?? undefined) : undefined;

  const slug = props.Slug?.type === 'rich_text' ? (getPlainText(props.Slug.rich_text) ?? page.id) : page.id;

  return {
    id: page.id,
    title: title ?? '제목 없음',
    description,
    coverImage: getCoverImage(page),
    tags: tags.length ? tags : undefined,
    author,
    date,
    modifiedDate,
    slug,
  };
};

export const getPublishedPosts = async () => {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID!;

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const dataSourceId = database.data_sources[0].id;
    console.log('Database Source ID:', dataSourceId);

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
    });

    const typedResults = response.results as (PageObjectResponse | PartialPageObjectResponse)[];

    const posts = typedResults
      .filter((item): item is PageObjectResponse => item.object === 'page')
      .map(mapPageToPost)
      .sort((a, b) => {
        const dateA = a.date ?? a.modifiedDate ?? '';
        const dateB = b.date ?? b.modifiedDate ?? '';
        return dateB.localeCompare(dateA); // 최신순
      });

    console.log('✅ Query 성공!');
    console.log('Response:', posts);
    return posts;
  } catch (error: unknown) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};
