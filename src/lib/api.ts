const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== Perspectives =====
export interface Perspective {
  id: number;
  name: string;
  nameEn: string;
  sortOrder: number;
  weightDefault: number | null;
  color: string | null;
  objectives?: Objective[];
}

export const perspectivesAPI = {
  getAll: () => fetchAPI<Perspective[]>('/perspectives'),
  updateWeight: (id: number, weight: number) =>
    fetchAPI<Perspective>(`/perspectives/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ weightDefault: weight }),
    }),
};

// ===== Strategic Themes =====
export interface StrategicTheme {
  id: number;
  name: string;
  description: string | null;
  color: string;
  year: number;
  sortOrder: number;
  isActive: boolean;
  _count?: { objectives: number };
}

export const strategicThemesAPI = {
  getAll: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return fetchAPI<StrategicTheme[]>(`/strategic-themes${query}`);
  },
  getOne: (id: number) => fetchAPI<StrategicTheme>(`/strategic-themes/${id}`),
  create: (data: { name: string; description?: string; color?: string; year?: number }) =>
    fetchAPI<StrategicTheme>('/strategic-themes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<StrategicTheme>) =>
    fetchAPI<StrategicTheme>(`/strategic-themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/strategic-themes/${id}`, { method: 'DELETE' }),
};

// ===== Objectives =====
export interface Objective {
  id: number;
  perspectiveId: number;
  departmentId: string;
  themeId: number | null;
  code: string | null;
  name: string;
  description: string | null;
  weight: number | null;
  positionX: number | null;
  positionY: number | null;
  year: number;
  isActive: boolean;
  perspective?: { id: number; name: string; color: string };
  theme?: { id: number; name: string; color: string };
  department?: { id: string; name: string; code: string };
  csfs?: CSF[];
  linksFrom?: { id: number; toObjectiveId: number }[];
  linksTo?: { id: number; fromObjectiveId: number }[];
}

export interface CreateObjectiveDTO {
  perspectiveId: number;
  departmentId: string;
  themeId?: number;
  name: string;
  code?: string;
  description?: string;
  weight?: number;
  positionX?: number;
  positionY?: number;
  year: number;
}

export interface CreateLinkDTO {
  fromObjectiveId: number;
  toObjectiveId: number;
}

export const objectivesAPI = {
  getAll: (filters?: { year?: number; perspectiveId?: number; departmentId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', filters.year.toString());
    if (filters?.perspectiveId) params.set('perspectiveId', filters.perspectiveId.toString());
    if (filters?.departmentId) params.set('departmentId', filters.departmentId);
    const query = params.toString() ? `?${params}` : '';
    return fetchAPI<Objective[]>(`/objectives${query}`);
  },
  getOne: (id: number) => fetchAPI<Objective>(`/objectives/${id}`),
  create: (data: CreateObjectiveDTO) =>
    fetchAPI<Objective>('/objectives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<CreateObjectiveDTO>) =>
    fetchAPI<Objective>(`/objectives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<Objective>(`/objectives/${id}`, { method: 'DELETE' }),
  
  // Strategy Map Links
  getAllLinks: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return fetchAPI<{ id: number; fromObjectiveId: number; toObjectiveId: number }[]>(
      `/objectives/links/all${query}`
    );
  },
  createLink: (data: CreateLinkDTO) =>
    fetchAPI<{ id: number }>('/objectives/links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteLink: (id: number) =>
    fetchAPI<void>(`/objectives/links/${id}`, { method: 'DELETE' }),
};

// ===== CSF =====
export interface CSF {
  id: number;
  objectiveId: number;
  content: string;
  sortOrder: number;
  objective?: { id: number; name: string; perspectiveId: number };
  kpiAllocations?: KPIAllocation[];
}

export interface CreateCSFDTO {
  objectiveId: number;
  content: string;
  sortOrder?: number;
}

export const csfAPI = {
  getAll: (objectiveId?: number) => {
    const query = objectiveId ? `?objectiveId=${objectiveId}` : '';
    return fetchAPI<CSF[]>(`/csf${query}`);
  },
  getOne: (id: number) => fetchAPI<CSF>(`/csf/${id}`),
  create: (data: CreateCSFDTO) =>
    fetchAPI<CSF>('/csf', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<CreateCSFDTO>) =>
    fetchAPI<CSF>(`/csf/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<CSF>(`/csf/${id}`, { method: 'DELETE' }),
};

// ===== KPI Library =====
export interface KPILibrary {
  id: number;
  name: string;
  definition: string | null;
  unit: string | null;
  kpiType: 'INPUT' | 'PROCESS' | 'OUTPUT' | 'OUTCOME';
  trend: 'POSITIVE' | 'NEGATIVE';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  formula: string | null;
  isActive: boolean;
}

export const kpiLibraryAPI = {
  getAll: () => fetchAPI<KPILibrary[]>('/kpi/library'),
  getOne: (id: number) => fetchAPI<KPILibrary>(`/kpi/library/${id}`),
  create: (data: Partial<KPILibrary>) =>
    fetchAPI<KPILibrary>('/kpi/library', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<KPILibrary>) =>
    fetchAPI<KPILibrary>(`/kpi/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<KPILibrary>(`/kpi/library/${id}`, { method: 'DELETE' }),
};

// ===== KPI Allocation =====
export interface KPIAllocation {
  id: number;
  csfId: number;
  kpiLibId: number;
  departmentId: string | null;
  ownerId: string | null;
  weight: number;
  targetMin: number | null;
  targetThreshold: number | null;
  targetGoal: number;
  targetMax: number | null;
  year: number;
  period: string | null;
  isActive: boolean;
  csf?: CSF;
  kpiLib?: KPILibrary;
  measurements?: KPIMeasurement[];
}

export const kpiAllocationAPI = {
  getAll: (filters?: { year?: number; departmentId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set('year', filters.year.toString());
    if (filters?.departmentId) params.set('departmentId', filters.departmentId);
    const query = params.toString() ? `?${params}` : '';
    return fetchAPI<KPIAllocation[]>(`/kpi/allocations${query}`);
  },
  getOne: (id: number) => fetchAPI<KPIAllocation>(`/kpi/allocations/${id}`),
  create: (data: Partial<KPIAllocation>) =>
    fetchAPI<KPIAllocation>('/kpi/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<KPIAllocation>) =>
    fetchAPI<KPIAllocation>(`/kpi/allocations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/kpi/allocations/${id}`, { method: 'DELETE' }),
};

// ===== KPI Measurement =====
export interface KPIMeasurement {
  id: number;
  allocationId: number;
  actualValue: number;
  scorePercent: number | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  measuredAt: string;
  note: string | null;
  allocation?: KPIAllocation;
}

export const kpiMeasurementAPI = {
  getAll: (allocationId?: number) => {
    const query = allocationId ? `?allocationId=${allocationId}` : '';
    return fetchAPI<KPIMeasurement[]>(`/kpi/measurements${query}`);
  },
  create: (data: { allocationId: number; actualValue: number; note?: string }) =>
    fetchAPI<KPIMeasurement>('/kpi/measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===== Scorecard Summary =====
export interface ScorecardKPI {
  id: number;
  allocationId: number;
  name: string;
  definition: string | null;
  unit: string | null;
  trend: 'POSITIVE' | 'NEGATIVE';
  frequency: string;
  targetMin: number | null;
  targetThreshold: number | null;
  targetGoal: number;
  targetMax: number | null;
  weight: number;
  dataSourceDepartment: string | null;
}

export interface ScorecardObjective {
  id: number;
  code: string | null;
  name: string;
  weight: number | null;
  kpis: ScorecardKPI[];
}

export interface ScorecardPerspective {
  id: number;
  name: string;
  nameEn: string;
  weight: number | null;
  color: string | null;
  objectives: ScorecardObjective[];
}

export interface ScorecardSummary {
  departmentId: string | null;
  departmentName: string | null;
  year: number;
  perspectives: ScorecardPerspective[];
  totals: {
    objectiveCount: number;
    kpiCount: number;
  };
}

export const scorecardAPI = {
  getSummary: (filters?: { departmentId?: string; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.set('departmentId', filters.departmentId);
    if (filters?.year) params.set('year', filters.year.toString());
    const query = params.toString() ? `?${params}` : '';
    return fetchAPI<ScorecardSummary>(`/scorecard/summary${query}`);
  },
};

// ===== Weighting Validation =====
export interface ObjectiveWeightStatus {
  id: number;
  name: string;
  code: string | null;
  weight: number;
  kpisSum: number;
  isValid: boolean;
  kpis: { id: number; name: string; weight: number }[];
}

export interface PerspectiveWeightStatus {
  id: number;
  name: string;
  color: string | null;
  weight: number;
  objectivesSum: number;
  isValid: boolean;
  objectives: ObjectiveWeightStatus[];
}

export interface WeightValidationStatus {
  isValid: boolean;
  totalPerspectivesWeight: number;
  isPerspectivesTotalValid: boolean;
  perspectives: PerspectiveWeightStatus[];
}

export interface WeightValidationSummary {
  isValid: boolean;
  totalPerspectivesWeight: number;
  perspectives: {
    id: number;
    name: string;
    weight: number;
    objectivesSum: number;
    objectiveCount: number;
    isValid: boolean;
    invalidObjectivesCount: number;
  }[];
}

export const weightingAPI = {
  getStatus: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return fetchAPI<WeightValidationStatus>(`/weighting/status${query}`);
  },
  getSummary: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return fetchAPI<WeightValidationSummary>(`/weighting/summary${query}`);
  },
};

