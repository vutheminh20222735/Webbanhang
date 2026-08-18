export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER'|'STAFF'|'MANAGER'|'ADMIN';
}
