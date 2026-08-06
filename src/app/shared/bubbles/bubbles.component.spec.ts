import {describe, it, expect, beforeEach} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BubblesComponent} from './bubbles.component';

describe('BubblesComponent', () => {
  let component: BubblesComponent;
  let fixture: ComponentFixture<BubblesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BubblesComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BubblesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders ten bubbles', () => {
    expect(fixture.nativeElement.querySelectorAll('ul.bg-bubbles li').length).toBe(10);
  });
});
