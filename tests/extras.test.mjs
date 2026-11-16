import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHeadlines} from '../lib/united.ts';
import {ELSEWHERE, ago, names, storylines, tone} from '../lib/newsdesk.ts';

test('headlines keep BBC links only and decode entities', () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[Carrick &amp; the board]]></title><description><![CDATA[A <b>big</b> week]]></description><link>https://www.bbc.co.uk/sport/football/articles/a1</link><pubDate>Tue, 10 Nov 2026 18:12:02 GMT</pubDate></item>
    <item><title>Elsewhere</title><link>https://example.com/x</link></item>
    <item><title>Plain http</title><link>http://www.bbc.co.uk/sport/x</link></item>
    <item><title>Not a URL</title><link>javascript:alert(1)</link></item>
  </channel></rss>`;
  assert.deepEqual(parseHeadlines(xml), [{title: 'Carrick & the board', summary: 'A big week', link: 'https://www.bbc.co.uk/sport/football/articles/a1', published: '2026-11-10T18:12:02.000Z'}]);
});

const h = (title, hoursAgo, summary = '') => ({title, summary, link: `https://www.bbc.co.uk/${encodeURIComponent(title)}`, published: new Date(Date.UTC(2026, 10, 10, 12) - hoursAgo * 36e5).toISOString()});
const NOW = Date.UTC(2026, 10, 10, 12);

test('names skip the club itself and fold possessives', () => {
  assert.deepEqual(names("Carrick's Man Utd future to be decided"), ['Carrick']);
  assert.deepEqual(names('Why Manchester United fans love Old Trafford'), []);
});

test('recurring names become storylines, and leftovers ride Elsewhere', () => {
  const lines = storylines([
    h('Carrick backs Bruno', 30), h('How close is Carrick to the exit?', 5), h("Carrick's future decided in Monaco", 1),
    h('Dorgu stuns Aston Villa', 50), h('Where does the Aston Villa draw rank?', 40),
    h('The day Ferguson quit', 70),
  ], NOW);
  assert.deepEqual(lines.map((l) => [l.name, l.stories.length]), [['Carrick', 3], ['Aston Villa', 2], [ELSEWHERE, 1]]);
  assert.ok(lines[0].stories[0].at < lines[0].stories[2].at, 'stations run oldest to newest');
});

test('tone reads the headline the way a fan would', () => {
  assert.equal(tone('How close is Carrick to the exit?'), 'bad');
  assert.equal(tone('United sign striker in record deal'), 'good');
  assert.equal(tone('Carrick speaks to the media'), 'neutral');
});

test('ago is compact', () => {
  assert.equal(ago(NOW - 5 * 6e4, NOW), '5m');
  assert.equal(ago(NOW - 3 * 36e5, NOW), '3h');
  assert.equal(ago(NOW - 49 * 36e5, NOW), '2d');
});
