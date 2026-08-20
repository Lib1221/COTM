export type ProjectStatus = "PLANNED" | "ONGOING" | "COMPLETED";

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  location: string;
  startDate: string;
  endDate: string | null;
  budget: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  latestProgress?: number;
}

export interface ProjectDetail extends Project {
  boqItems: BoqItem[];
  progressRecords: ProgressRecord[];
  inventoryTransactions: InventoryTransaction[];
  boqValue: number;
  latestProgress: number;
}

export interface BoqItem {
  id: string;
  projectId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BoqResponse {
  items: BoqItem[];
  totalValue: number;
}

export interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  isLowStock?: boolean;
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  projectId: string | null;
  type: "STOCK_IN" | "STOCK_OUT";
  quantity: number;
  date: string;
  reference: string | null;
  material?: { id: string; name: string; code: string; unit: string };
  project?: { id: string; name: string; code: string };
}

export interface ProgressRecord {
  id: string;
  projectId: string;
  date: string;
  description: string;
  progressPercent: number;
  notes: string | null;
}

export interface Dashboard {
  projects: {
    total: number;
    ongoing: number;
    completed: number;
  };
  inventory: {
    totalMaterials: number;
    lowStockCount: number;
    lowStock: Material[];
  };
  projectPerformance: {
    id: string;
    name: string;
    code: string;
    budget: number;
    boqValue: number;
    progressPercent: number;
    status: ProjectStatus;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
