import { Action, List, ActionPanel, Icon } from '@raycast/api';
import { useFetch } from '@raycast/utils';
import { useState } from 'react';
import * as cheerio from 'cheerio';

type Result = {
  category: string;
  title: string;
  url: string;
  cover: string;
  info: string;
  rating: string;
};

type SearchResult = Result[];

export default function Command() {
  const [search, setSearch] = useState<string>('');
  const [showingDetail, setShowingDetail] = useState(true);

  const { data, isLoading } = useFetch(`https://www.douban.com/search?q=${search}`, {
    execute: search.trim().length > 0,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    },
    async parseResponse(response) {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const results: SearchResult = [];
      const data = await response.text();
      if (data) {
        const $ = cheerio.load(data);
        const items = $('div.result');

        items.each((index, item) => {
          const category = $(item).find('h3 span:first')?.text()?.trim() || '';
          const url = $(item).find('div.content a')?.prop('href')?.trim() || '';
          const title = $(item).find('div.title a')?.text()?.trim() || '';
          const cover = $(item).find("img[src^='https']").attr('src') || '';
          const info =
            $(item).find('span.subject-cast')?.text()?.trim() || $(item).find('div.info')?.text()?.trim() || '';
          const rating = $(item).find('span.rating_nums')?.text()?.trim() || '';

          const result: Result = {
            category,
            title,
            url,
            cover,
            info,
            rating,
          };

          results.push(result);
        });
      }

      return results;
    },
  });

  function metadata(result: Result) {
    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label title="Info" text={result.info} />
        <List.Item.Detail.Metadata.Label title="Rating" text={result.rating} />
      </List.Item.Detail.Metadata>
    );
  }

  return (
    <List
      isShowingDetail={true}
      isLoading={isLoading}
      throttle={true}
      searchBarPlaceholder="Search Multi on Douban"
      onSearchTextChange={(newValue) => setSearch(newValue)}
    >
      {search === '' ? (
        <List.EmptyView />
      ) : (
        data &&
        data.map((result) => (
          <List.Item
            key={result.url}
            title={result.title}
            subtitle={result.category}
            icon={{ source: result.cover }}
            detail={
              <List.Item.Detail
                markdown={`![Illustration](${result.cover})`}
                metadata={showingDetail ? metadata(result) : ''}
              />
            }
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={result.url} />
                <Action
                  title="Toggle Details"
                  icon={Icon.AppWindowList}
                  shortcut={{ modifiers: ['cmd', 'shift'], key: 'd' }}
                  onAction={() => setShowingDetail(!showingDetail)}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
