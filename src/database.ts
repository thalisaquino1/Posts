export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "MANAGER" | "USER";
  active: boolean;
  createdAt: string;
};

export type Demand = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  createdBy: string; 
  assignedTo: string | null; 
  createdAt: string;
};

export type HistoryEntry = {
  id: string;
  demandId: string; 
  action: string; 
  performedBy: string; 
  createdAt: string;
};
export const users: User[] = [];
export const demands: Demand[] = [];
export const history: HistoryEntry[] = [];
export const refreshTokens: string[] = []; 