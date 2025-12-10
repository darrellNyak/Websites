import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CelebrityCard } from './celebrity-card';

describe('CelebrityCard', () => {
  let component: CelebrityCard;
  let fixture: ComponentFixture<CelebrityCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CelebrityCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CelebrityCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
