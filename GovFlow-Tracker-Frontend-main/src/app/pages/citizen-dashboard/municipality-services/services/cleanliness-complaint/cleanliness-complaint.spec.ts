import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CleanlinessComplaintComponent } from './cleanliness-complaint.component';
import { FormsModule } from '@angular/forms';

describe('CleanlinessComplaintComponent', () => {
  let component: CleanlinessComplaintComponent;
  let fixture: ComponentFixture<CleanlinessComplaintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, CleanlinessComplaintComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CleanlinessComplaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.serviceTitle).toBe('Cleanliness Complaint');
    expect(component.fullName).toBe('Ahmed Al-Rashid');
    expect(component.nationalId).toBe('123456789');
    expect(component.urgencyLevel).toBe('Medium');
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should handle file selection', () => {
    const mockFile = new File([''], 'cleanliness_photo.jpg', { type: 'image/jpeg' });
    const mockEvent = { target: { files: [mockFile] } };

    component.onFileSelected(mockEvent);

    expect(component.uploadedFiles).toContain('cleanliness_photo.jpg');
    expect(component.showUploadedFiles).toBeTrue();
  });

  it('should remove files', () => {
    component.uploadedFiles = ['photo1.jpg', 'photo2.jpg'];
    component.showUploadedFiles = true;

    component.removeFile(0);

    expect(component.uploadedFiles).toEqual(['photo2.jpg']);
    expect(component.showUploadedFiles).toBeTrue();

    component.removeFile(0);
    expect(component.uploadedFiles).toEqual([]);
    expect(component.showUploadedFiles).toBeFalse();
  });

  it('should submit form', () => {
    spyOn(console, 'log');
    spyOn(window, 'alert');

    const mockEvent = { preventDefault: jasmine.createSpy() };
    component.complaintLocation = 'Central Park';
    component.complaintDetails = 'Garbage accumulation near the fountain';
    component.urgencyLevel = 'High';
    component.uploadedFiles = ['photo1.jpg'];

    component.submitServiceRequest(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Submitting cleanliness complaint...');
    expect(window.alert).toHaveBeenCalledWith('Cleanliness complaint submitted successfully!');
  });
});
