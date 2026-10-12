import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessLicenseComponent } from './business-license.component';
import { FormsModule } from '@angular/forms';

describe('BusinessLicenseComponent', () => {
  let component: BusinessLicenseComponent;
  let fixture: ComponentFixture<BusinessLicenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, BusinessLicenseComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessLicenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.serviceTitle).toBe('Business License');
    expect(component.fullName).toBe('Ahmed Al-Rashid');
    expect(component.nationalId).toBe('123456789');
    expect(component.licenseCategory).toBe('Private Vehicle');
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should handle file selection', () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = { target: { files: [mockFile] } };

    component.onFileSelected(mockEvent);

    expect(component.uploadedFiles).toContain('test.pdf');
    expect(component.showUploadedFiles).toBeTrue();
  });

  it('should remove files', () => {
    component.uploadedFiles = ['test1.pdf', 'test2.pdf'];
    component.showUploadedFiles = true;

    component.removeFile(0);

    expect(component.uploadedFiles).toEqual(['test2.pdf']);
    expect(component.showUploadedFiles).toBeTrue();

    component.removeFile(0);
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should submit form', () => {
    spyOn(console, 'log');
    spyOn(window, 'alert');

    const mockEvent = { preventDefault: jasmine.createSpy() };
    component.licenseNumber = 'TEST123';
    component.licenseCategory = 'Commercial Vehicle';
    component.uploadedFiles = ['test.pdf'];

    component.submitServiceRequest(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Submitting service request...');
    expect(window.alert).toHaveBeenCalledWith('Service request submitted successfully!');
  });
});
