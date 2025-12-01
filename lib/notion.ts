import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  UserObjectResponse,
  PartialUserObjectResponse,
  GroupObjectResponse,
  BlockObjectResponse,
  PartialBlockObjectResponse,
  ListBlockChildrenResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { Post, TagFilterItem } from '@/types/blog';
import { NotionToMarkdown } from 'notion-to-md';

const { Client } = require('@notionhq/client');

// children이 포함된 블록 타입
type BlockWithChildren = (BlockObjectResponse | PartialBlockObjectResponse) & {
  children?: BlockWithChildren[];
};

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03',
});

const n2m = new NotionToMarkdown({ notionClient: notion });

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

// Notion 페이지의 모든 블록을 재귀적으로 가져오는 헬퍼 함수
const getAllBlocks = async (pageId: string): Promise<BlockWithChildren[]> => {
  const blocks: (BlockObjectResponse | PartialBlockObjectResponse)[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: ListBlockChildrenResponse = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });

    blocks.push(...response.results);

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  // 중첩된 블록도 가져오기
  const blocksWithChildren: BlockWithChildren[] = await Promise.all(
    blocks.map(async (block): Promise<BlockWithChildren> => {
      if ('has_children' in block && block.has_children && 'id' in block) {
        const children = await getAllBlocks(block.id);
        return {
          ...block,
          children,
        } as BlockWithChildren;
      }
      return block as BlockWithChildren;
    })
  );

  return blocksWithChildren;
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

// 게시글 조회
export const getPublishedPosts = async (tag?: string) => {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID!;

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const dataSourceId = database.data_sources[0].id;

    // 필터 조건 구성
    const filterConditions: Array<{ property: 'Status'; select: { equals: string } } | { property: 'Tags'; multi_select: { contains: string } }> = [
      {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
    ];

    // 태그 필터 추가 (전체가 아닌 경우)
    if (tag && tag !== '전체') {
      filterConditions.push({
        property: 'Tags',
        multi_select: {
          contains: tag,
        },
      });
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter:
        filterConditions.length === 1
          ? filterConditions[0]
          : {
              and: filterConditions,
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

    // console.log('✅ Query 성공!');
    // console.log('!!!esponse:', posts);
    return posts;
  } catch (error: unknown) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// 태그 조회
export const getTags = async (): Promise<TagFilterItem[]> => {
  const posts = await getPublishedPosts();

  // 모든 태그를 추출하고 각 태그의 출현 횟수를 계산
  const tagCount = posts.reduce(
    (acc, post) => {
      post.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  // TagFilterItem 형식으로 변환
  const tags: TagFilterItem[] = Object.entries(tagCount).map(([name, count]) => ({
    id: name,
    name,
    count,
  }));

  // "전체" 태그 추가
  tags.unshift({
    id: 'all',
    name: '전체',
    count: posts.length,
  });

  // 태그 이름 기준으로 정렬 ("전체" 태그는 항상 첫 번째에 위치하도록 제외)
  const [allTag, ...restTags] = tags;
  const sortedTags = restTags.sort((a, b) => a.name.localeCompare(b.name));

  return [allTag, ...sortedTags];
};

// 게시글 상세 조회
export const getPostBySlug = async (slug: string) => {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID!;

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const dataSourceId = database.data_sources[0].id;

    // Slug와 Status가 Published인 조건으로 필터링
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'Status',
            select: {
              equals: 'Published',
            },
          },
        ],
      },
    });

    const typedResults = response.results as (PageObjectResponse | PartialPageObjectResponse)[];

    // 페이지 찾기
    const page = typedResults.find((item) => item.object === 'page') as PageObjectResponse | undefined;

    if (!page) {
      throw new Error('페이지를 찾을 수 없습니다.');
    }

    // 메타데이터 추출
    const metadata = mapPageToPost(page);

    // 블록 데이터 가져오기
    const blocks = await getAllBlocks(page.id);
    const mdBlocks = await n2m.blocksToMarkdown(blocks);

    return {
      metadata,
      mdBlocks,
    };
  } catch (error: unknown) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};
