// // src/app/interfaces/user.interface.ts
// export interface User {
//   id: number;
//   fullName: string;
//   email: string;
//   role: string;
//   nationalId?: string; // أضف هذه الخاصية لتكون متوفرة
// }


// src/app/interfaces/user.interface.ts
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  nationalId?: string;

  // ✨ --- START: Updated Missing Fields --- ✨
  phoneNumber?: string;
  address?: string;
  // ✨ --- END: Updated Missing Fields --- ✨
}
