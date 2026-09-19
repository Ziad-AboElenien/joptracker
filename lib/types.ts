export interface ColumnT {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export interface JobCardT {
  id: string;
  columnId: string;
  order: number;
  company: string;
  role: string;
  jobUrl?: string | null;
  salary?: number | null;
  notes?: string | null;
  tags: string[];
  dateApplied?: string | null; // ISO string on client
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogT {
  id: string;
  jobCardId: string;
  action: string;
  timestamp: string;
}

export interface BoardState {
  boardId: string | null;
  boardName: string;
}
