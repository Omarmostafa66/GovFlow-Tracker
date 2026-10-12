import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InactivityPopup } from './inactivity-popup';

describe('InactivityPopup', () => {
  let component: InactivityPopup;
  let fixture: ComponentFixture<InactivityPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactivityPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InactivityPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
