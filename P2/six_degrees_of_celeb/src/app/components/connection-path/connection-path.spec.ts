import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionPath } from './connection-path';

describe('ConnectionPath', () => {
  let component: ConnectionPath;
  let fixture: ComponentFixture<ConnectionPath>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionPath]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectionPath);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
