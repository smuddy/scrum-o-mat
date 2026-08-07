import {describe, it, expect, beforeEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {firstValueFrom, of} from 'rxjs';

import {ActionItemsComponent} from './action-items.component';
import {RetroService} from '../../retro.service';
import {RetroActionItemId} from '../../models/retro';

describe('ActionItemsComponent', () => {
  let component: ActionItemsComponent;
  let fixture: ComponentFixture<ActionItemsComponent>;
  let retroService: any;

  const item = (overrides: Partial<RetroActionItemId> = {}): RetroActionItemId => ({
    id: 'item1',
    text: 'Etwas tun',
    done: false,
    authorId: 'author1',
    order: 1,
    created: new Date(),
    modified: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    retroService = {
      getActionItems$: vi.fn().mockReturnValue(of([])),
      addActionItem: vi.fn().mockResolvedValue('newId'),
      updateActionItem: vi.fn().mockResolvedValue(undefined),
      toggleActionItemDone: vi.fn().mockResolvedValue(undefined),
      deleteActionItem: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ActionItemsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: RetroService, useValue: retroService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionItemsComponent);
    component = fixture.componentInstance;
    component.boardId = 'board1';
    component.myUid = 'author1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('subscribes to the live action items via getActionItems$ using the bound boardId', () => {
    expect(retroService.getActionItems$).toHaveBeenCalledWith('board1');
  });

  describe('sorting', () => {
    it('sorts open items before done items, each ascending by order', async () => {
      const items = [
        item({id: 'a', order: 3, done: false}),
        item({id: 'b', order: 1, done: true}),
        item({id: 'c', order: 2, done: false}),
        item({id: 'd', order: 0, done: true}),
      ];
      retroService.getActionItems$.mockReturnValue(of(items));
      const localFixture = TestBed.createComponent(ActionItemsComponent);
      localFixture.componentInstance.boardId = 'board1';
      localFixture.detectChanges();

      const result = await firstValueFrom(localFixture.componentInstance.items$);

      expect(result.map(i => i.id)).toEqual(['c', 'a', 'd', 'b']);
    });
  });

  describe('canEdit', () => {
    it('is true for the item author', () => {
      expect(component.canEdit(item({authorId: 'author1'}))).toBe(true);
    });

    it('is true for the board owner even if not the author', () => {
      component.isOwner = true;
      expect(component.canEdit(item({authorId: 'someone-else'}))).toBe(true);
    });

    it('is false for a non-author, non-owner viewer', () => {
      component.isOwner = false;
      expect(component.canEdit(item({authorId: 'someone-else'}))).toBe(false);
    });
  });

  describe('addItem', () => {
    it('delegates to retroService.addActionItem with trimmed text/assignee, then clears the form', async () => {
      component.newItemText = '  Foo  ';
      component.newItemAssignee = '  Bar  ';

      await component.addItem();

      expect(retroService.addActionItem).toHaveBeenCalledWith('board1', 'Foo', 'Bar');
      expect(component.newItemText).toBe('');
      expect(component.newItemAssignee).toBe('');
    });

    it('passes undefined as assignee when the field is left empty', async () => {
      component.newItemText = 'Foo';
      component.newItemAssignee = '   ';

      await component.addItem();

      expect(retroService.addActionItem).toHaveBeenCalledWith('board1', 'Foo', undefined);
    });

    it('does nothing when the text is empty/whitespace-only', async () => {
      component.newItemText = '   ';

      await component.addItem();

      expect(retroService.addActionItem).not.toHaveBeenCalled();
    });
  });

  describe('toggleDone', () => {
    it('delegates to retroService.toggleActionItemDone with the flipped done state, for any viewer', async () => {
      component.myUid = 'someone-else';
      component.isOwner = false;

      await component.toggleDone(item({id: 'item1', done: false, authorId: 'author1'}));
      expect(retroService.toggleActionItemDone).toHaveBeenCalledWith('board1', 'item1', true);

      await component.toggleDone(item({id: 'item2', done: true, authorId: 'author1'}));
      expect(retroService.toggleActionItemDone).toHaveBeenCalledWith('board1', 'item2', false);
    });
  });

  describe('edit lifecycle', () => {
    it('startEdit seeds the editing buffers from the item', () => {
      component.startEdit(item({id: 'item1', text: 'Foo', assignee: 'Bar'}));

      expect(component.editingItemId).toBe('item1');
      expect(component.editingText).toBe('Foo');
      expect(component.editingAssignee).toBe('Bar');
    });

    it('startEdit seeds an empty assignee buffer when the item has none', () => {
      component.startEdit(item({id: 'item1', assignee: undefined}));

      expect(component.editingAssignee).toBe('');
    });

    it('cancelEdit clears the editing state', () => {
      component.startEdit(item({id: 'item1'}));

      component.cancelEdit();

      expect(component.editingItemId).toBeNull();
      expect(component.editingText).toBe('');
      expect(component.editingAssignee).toBe('');
    });

    it('saveEdit delegates to retroService.updateActionItem with trimmed text/assignee and ends editing', async () => {
      component.startEdit(item({id: 'item1'}));
      component.editingText = '  Neuer Text  ';
      component.editingAssignee = '  Someone  ';

      await component.saveEdit('item1');

      expect(retroService.updateActionItem).toHaveBeenCalledWith('board1', 'item1', {text: 'Neuer Text', assignee: 'Someone'});
      expect(component.editingItemId).toBeNull();
    });

    it('saveEdit does nothing when the text is empty/whitespace-only', async () => {
      component.startEdit(item({id: 'item1'}));
      component.editingText = '   ';

      await component.saveEdit('item1');

      expect(retroService.updateActionItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('delegates to retroService.deleteActionItem', async () => {
      await component.deleteItem('item1');

      expect(retroService.deleteActionItem).toHaveBeenCalledWith('board1', 'item1');
    });

    it('cancels an in-progress edit of the item being deleted', async () => {
      component.startEdit(item({id: 'item1'}));

      await component.deleteItem('item1');

      expect(component.editingItemId).toBeNull();
    });
  });
});
