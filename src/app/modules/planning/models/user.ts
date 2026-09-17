export interface User {
  name: string;
  email?: string | null;
}

export interface UserId extends User {
  id: string;
}
