import {describe, it, expect, beforeEach} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {MenuService} from './menu.service';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with no menu entries', () => {
    let entries: any[];
    service.menuEntries$.subscribe(_ => entries = _);
    expect(entries).toEqual([]);
  });

  it('adds a custom action with the confirm flag defaulting to false', () => {
    let entries: any[];
    service.menuEntries$.subscribe(_ => entries = _);
    const action = () => undefined;

    service.addCustomAction('Delete', action);

    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('Delete');
    expect(entries[0].action).toBe(action);
    expect(entries[0].confirm).toBe(false);
  });

  it('adds a custom component entry with the given inputs, leaving name/action as no-op placeholders', () => {
    let entries: any[];
    service.menuEntries$.subscribe(_ => entries = _);
    class Widget {}

    service.addCustomComponent(Widget as any, {boardId: 'b1'});

    expect(entries.length).toBe(1);
    expect(entries[0].component).toBe(Widget);
    expect(entries[0].inputs).toEqual({boardId: 'b1'});
    expect(entries[0].name).toBe('');
    expect(typeof entries[0].action).toBe('function');
  });

  it('resets the custom actions', () => {
    let entries: any[];
    service.menuEntries$.subscribe(_ => entries = _);
    service.addCustomAction('Delete', () => undefined, true);

    service.resetCustomActions();

    expect(entries).toEqual([]);
  });

  it('opens, closes and toggles the menu', () => {
    let open: boolean;
    service.menuOpen$.subscribe(_ => open = _);
    expect(open).toBe(false);

    service.openMenu();
    expect(open).toBe(true);

    service.closeMenu();
    expect(open).toBe(false);

    service.toggleMenu();
    expect(open).toBe(true);
    service.toggleMenu();
    expect(open).toBe(false);
  });

});
