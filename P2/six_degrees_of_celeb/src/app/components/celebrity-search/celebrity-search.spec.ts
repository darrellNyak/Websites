import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CelebritySearch } from './celebrity-search';

describe('CelebritySearch', () => {
  let component: CelebritySearch;
  let fixture: ComponentFixture<CelebritySearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CelebritySearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CelebritySearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
