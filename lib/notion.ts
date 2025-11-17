const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03',
});

export const getPublishedPosts = async () => {
  try {
    // 1. database 정보 가져오기
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    // 2. data source id
    const dataSourceId = database.data_sources[0].id;
    console.log('Database Source ID:', dataSourceId);

    // 3. dataSources.query
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
          timestampe: 'created_times',
          direction: 'descending',
        },
      ],
    });

    console.log('Response:', response);
    return response.results;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
