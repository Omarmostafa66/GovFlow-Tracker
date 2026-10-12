import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseReplacement } from './license-renewal';

describe('LicenseReplacement', () => {
  let component: LicenseReplacement;
  let fixture: ComponentFixture<LicenseReplacement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenseReplacement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LicenseReplacement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
