// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { RenovationPermitComponent } from './renovation-permit.component';
// import { FormsModule } from '@angular/forms';
//
// describe('RenovationPermitComponent', () => {
//   let component: RenovationPermitComponent;
//   let fixture: ComponentFixture<RenovationPermitComponent>;
//
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [FormsModule, RenovationPermitComponent]
//     }).compileComponents();
//
//     fixture = TestBed.createComponent(RenovationPermitComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });
//
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
//
//   it('should have default values', () => {
//     expect(component.serviceTitle).toBe('Renovation Permit');
//     expect(component.fullName).toBe('Ahmed Al-Rashid');
//     expect(component.nationalId).toBe('123456789');
//     expect(component.renovationType).toBe('Interior');
//     expect(component.uploadedFiles).toEqual([]);
//     expect(component.showUploadedFiles).toBeFalse();
//   });
//
//   it('should handle file selection', () => {
//     const mockFile = new File([''], 'property_deed.pdf', { type: 'application/pdf' });
//     const mockEvent = { target: { files: [mockFile] } };
//
//     component.onFileSelected(mockEvent);
//
//     expect(component.uploadedFiles).toContain('property_deed.pdf');
//     expect(component.showUploadedFiles).toBeTrue();
//   });
//
//   it('should remove files', () => {
//     component.uploadedFiles = ['deed.pdf', 'plans.pdf'];
//     component.showUploadedFiles = true;
//
//     component.removeFile(0);
//
//     expect(component.uploadedFiles).toEqual(['plans.pdf']);
//     expect(component.showUploadedFiles).toBeTrue();
//
//     component.removeFile(0);
//     expect(component.uploadedFiles).toEqual([]);
//     expect(component.showUploadedFiles).toBeFalse();
//   });
//
//   it('should submit form', () => {
//     spyOn(console, 'log');
//     spyOn(window, 'alert');
//
//     const mockEvent = { preventDefault: jasmine.createSpy() };
//     component.propertyAddress = '123 Main Street, Riyadh';
//     component.renovationType = 'Interior';
//     component.contractorName = 'ABC Construction';
//     component.contractorLicense = 'CONT12345';
//     component.estimatedCost = '50000';
//     component.startDate = '2023-12-01';
//     component.endDate = '2023-12-15';
//     component.uploadedFiles = ['deed.pdf', 'plans.pdf'];
//
//     component.submitServiceRequest(mockEvent);
//
//     expect(mockEvent.preventDefault).toHaveBeenCalled();
//     expect(console.log).toHaveBeenCalledWith('Submitting renovation permit request...');
//     expect(window.alert).toHaveBeenCalledWith('Renovation permit request submitted successfully!');
//   });
// });
