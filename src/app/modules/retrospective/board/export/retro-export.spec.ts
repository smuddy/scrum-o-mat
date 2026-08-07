import {describe, it, expect} from 'vitest';

import {boardToCsv, boardToMarkdown} from './retro-export';
import {RetroActionItemId, RetroBoardId, RetroCardId} from '../../models/retro';

describe('retro-export', () => {
  const board: RetroBoardId = {
    id: 'board1',
    ownerId: 'owner1',
    title: 'Sprint Retro',
    columns: [
      {id: 'col2', name: 'Doing', color: '#222222', order: 1},
      {id: 'col1', name: 'To Do', color: '#111111', order: 0},
    ],
    hidden: false,
    timerEndsAt: null,
    created: new Date(),
    modified: new Date(),
  };

  function makeCard(partial: Partial<RetroCardId> & {id: string; columnId: string; order: number; text: string}): RetroCardId {
    return {
      authorId: 'author1',
      created: new Date(),
      modified: new Date(),
      ...partial,
    };
  }

  describe('boardToMarkdown', () => {
    const cardNoVotesNoReactions = makeCard({id: 'c1', columnId: 'col1', order: 0, text: 'Plain card'});
    const cardWithVotes = makeCard({id: 'c2', columnId: 'col1', order: 1, text: 'Voted card', votes: {u1: 2, u2: 1}});
    const cardWithReactions = makeCard({
      id: 'c3', columnId: 'col2', order: 0, text: 'Reacted card', reactions: {'👍': ['u1', 'u2'], '❤️': ['u1']},
    });
    const cardWithVotesAndReactions = makeCard({
      id: 'c4', columnId: 'col2', order: 1, text: 'Voted and reacted', votes: {u1: 3}, reactions: {'🎉': ['u1']},
    });

    const actionItems: RetroActionItemId[] = [
      {id: 'a2', text: 'Second item', assignee: 'Alice', done: false, authorId: 'u1', order: 1, created: new Date(), modified: new Date()},
      {id: 'a1', text: 'First item', done: true, authorId: 'u1', order: 0, created: new Date(), modified: new Date()},
    ];

    const cards = [cardNoVotesNoReactions, cardWithVotes, cardWithReactions, cardWithVotesAndReactions];
    const markdown = boardToMarkdown(board, cards, actionItems);
    const lines = markdown.split('\n');

    it('starts with the board title as an H1', () => {
      expect(lines[0]).toBe('# Sprint Retro');
    });

    it('renders columns sorted by order, each as an H2', () => {
      const todoIndex = lines.indexOf('## To Do');
      const doingIndex = lines.indexOf('## Doing');
      expect(todoIndex).toBeGreaterThan(-1);
      expect(doingIndex).toBeGreaterThan(todoIndex);
    });

    it('renders a plain card as a bullet with no vote/reaction suffix', () => {
      expect(lines).toContain('- Plain card');
    });

    it('renders a card with votes with the summed ★-count', () => {
      expect(lines).toContain('- Voted card (★3)');
    });

    it('renders a card with reactions with per-emoji counts, no vote suffix when unvoted', () => {
      expect(lines).toContain('- Reacted card 👍2 ❤️1');
    });

    it('renders a card with both votes and reactions together', () => {
      expect(lines).toContain('- Voted and reacted (★3) 🎉1');
    });

    it('renders the Action-Items section with [x]/[ ] and optional @assignee', () => {
      const sectionIndex = lines.indexOf('## Action-Items');
      expect(sectionIndex).toBeGreaterThan(-1);
      // order-sortiert: a1 (order 0) vor a2 (order 1).
      expect(lines).toContain('- [x] First item');
      expect(lines).toContain('- [ ] Second item (@Alice)');
      expect(lines.indexOf('- [x] First item')).toBeGreaterThan(sectionIndex);
      expect(lines.indexOf('- [x] First item')).toBeLessThan(lines.indexOf('- [ ] Second item (@Alice)'));
    });

    it('does not render a vote suffix when the votes map sums to 0 (e.g. absent)', () => {
      expect(markdown).not.toContain('Plain card (★');
    });
  });

  describe('boardToCsv', () => {
    it('starts with the fixed header row', () => {
      const csv = boardToCsv(board, []);
      expect(csv.split('\n')[0]).toBe('Spalte,Karte,Stimmen');
    });

    it('renders one row per card with column name, text and summed votes, columns in order', () => {
      const cardA = makeCard({id: 'c1', columnId: 'col1', order: 0, text: 'Alpha', votes: {u1: 2}});
      const cardB = makeCard({id: 'c2', columnId: 'col2', order: 0, text: 'Beta'});
      const csv = boardToCsv(board, [cardB, cardA]);
      const rows = csv.split('\n');

      expect(rows[0]).toBe('Spalte,Karte,Stimmen');
      expect(rows[1]).toBe('To Do,Alpha,2');
      expect(rows[2]).toBe('Doing,Beta,0');
      expect(rows).toHaveLength(3);
    });

    it('escapes a card text containing a comma by quoting the whole value', () => {
      const card = makeCard({id: 'c1', columnId: 'col1', order: 0, text: 'Needs work, but ok'});
      const csv = boardToCsv(board, [card]);

      expect(csv).toContain('"Needs work, but ok"');
    });

    it('escapes a card text containing double quotes by doubling them and wrapping in quotes', () => {
      const card = makeCard({id: 'c1', columnId: 'col1', order: 0, text: 'She said "great"'});
      const csv = boardToCsv(board, [card]);

      expect(csv).toContain('"She said ""great"""');
    });

    it('escapes a card text containing a newline by wrapping in quotes', () => {
      const card = makeCard({id: 'c1', columnId: 'col1', order: 0, text: 'Line one\nLine two'});
      const csv = boardToCsv(board, [card]);

      expect(csv).toContain('"Line one\nLine two"');
    });
  });
});
