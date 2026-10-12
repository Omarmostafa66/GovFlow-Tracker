import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BuildingPermitComponent } from './building-permit.components';

describe('BuildingPermitComponent', () => {
  let component: BuildingPermitComponent;
  let fixture: ComponentFixture<BuildingPermitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuildingPermitComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildingPermitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.fullName).toBe('Ahmed Al-Rashid');
    expect(component.nationalId).toBe('123456789');
    expect(component.licenseCategory).toBe('Private Vehicle');
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should add files when selected', () => {
    const mockFile = new File([''], 'deed.pdf', { type: 'application/pdf' });
    const mockEvent = { target: { files: [mockFile] } };

    component.onFileSelected(mockEvent);

    expect(component.uploadedFiles).toContain('deed.pdf');
    expect(component.showUploadedFiles).toBeTrue();
  });

  it('should remove files', () => {
    component.uploadedFiles = ['deed.pdf', 'plans.pdf'];
    component.showUploadedFiles = true;

    component.removeFile(0);

    expect(component.uploadedFiles).toEqual(['plans.pdf']);
    expect(component.showUploadedFiles).toBeTrue();

    component.removeFile(0);
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should submit form', () => {
    spyOn(console, 'log');
    const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') };

    component.licenseNumber = 'PROP12345';
    component.licenseCategory = 'Commercial Vehicle';
    component.submitServiceRequest(mockEvent as unknown as Event);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Building permit form submitted', {
      fullName: 'Ahmed Al-Rashid',
      nationalId: '123456789',
      licenseNumber: 'PROP12345',
      licenseCategory: 'Commercial Vehicle',
      uploadedFiles: []
    });
  });
});
