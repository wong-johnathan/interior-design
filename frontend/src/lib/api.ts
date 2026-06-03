type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, signal } = options;
    const url = `${this.baseUrl}${path}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ApiError(
        errorBody || `Request failed: ${response.statusText}`,
        response.status
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // BTO Projects
  async getBTOProjects(params?: { year?: number; location?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.year) searchParams.set('year', String(params.year));
    if (params?.location) searchParams.set('location', params.location);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return this.request<BTOProject[]>(`/bto${qs ? `?${qs}` : ''}`);
  }

  async getBTOProject(slug: string) {
    return this.request<BTOProject>(`/bto/${slug}`);
  }

  async getFlatModels(btoId: string) {
    return this.request<FlatModel[]>(`/bto/${btoId}/models`);
  }

  async getFlatModel(id: string) {
    return this.request<FlatModel>(`/models/${id}`);
  }

  // Projects
  async createProject(data: { flatModelId: string; name?: string }) {
    return this.request<Project>('/projects', { method: 'POST', body: data });
  }

  async getProject(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request<Project>(`/projects/${id}`, { method: 'PUT', body: data });
  }

  async updateDesignBrief(projectId: string, brief: DesignBrief) {
    return this.request<Project>(`/projects/${projectId}/brief`, { method: 'PUT', body: brief });
  }

  // AI Consultant
  async sendChatMessage(projectId: string, message: string) {
    return this.request<ChatResponse>(`/ai/consult`, {
      method: 'POST',
      body: { projectId, message },
    });
  }

  getChatStreamUrl(projectId: string): string {
    return `${this.baseUrl}/ai/consult/stream?projectId=${projectId}`;
  }

  // Render
  async triggerRender(projectId: string, roomType: string) {
    return this.request<RenderRecord>('/render', {
      method: 'POST',
      body: { projectId, roomType },
    });
  }

  async getRender(id: string) {
    return this.request<RenderRecord>(`/render/${id}`);
  }

  async getProjectRenders(projectId: string) {
    return this.request<RenderRecord[]>(`/projects/${projectId}/renders`);
  }

  // Export
  async exportProject(projectId: string, format: 'dae' | 'obj', includeFurniture: boolean) {
    return this.request<{ downloadUrl: string }>('/export', {
      method: 'POST',
      body: { projectId, format, includeFurniture },
    });
  }

  async importFile(projectId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new ApiError('Import failed', response.status);
    return response.json();
  }

  // Furniture
  async getFurnitureTemplates(params?: { roomType?: string; styleTag?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.roomType) searchParams.set('roomType', params.roomType);
    if (params?.styleTag) searchParams.set('styleTag', params.styleTag);
    const qs = searchParams.toString();
    return this.request<FurnitureTemplate[]>(`/furniture/templates${qs ? `?${qs}` : ''}`);
  }

  async applyFurnitureTemplate(projectId: string, templateId: string, roomType: string) {
    return this.request<Project>('/furniture/apply', {
      method: 'POST',
      body: { projectId, templateId, roomType },
    });
  }

  // Upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new ApiError('Upload failed', response.status);
    return response.json();
  }
}

export const api = new ApiClient();
export { ApiClient, ApiError };

// Types
export interface BTOProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  launchYear: number;
  location: string;
  developer: string;
  published: boolean;
  models?: FlatModel[];
  createdAt: string;
  updatedAt: string;
}

export interface FlatModel {
  id: string;
  btoProjectId: string;
  name: string;
  flatType: string;
  floorPlanUrl?: string;
  totalArea?: number;
  thumbnailUrl?: string;
  published: boolean;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  flatModelId?: string;
  wallEdits?: unknown;
  designBrief?: DesignBrief;
  furnitureState?: unknown;
  chatHistory?: ChatMessage[];
  renders?: RenderRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface DesignBrief {
  overallVibe: string;
  rooms: Record<string, RoomBrief>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomBrief {
  roomType: string;
  label: string;
  style: string;
  description: string;
  wallColor: string;
  wallFinish: string;
  floorType: string;
  floorColor: string;
  accentColor: string;
  furnitureStyle: string;
  lighting: string;
  specialNotes: string;
  renderPrompt: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  options?: string[];
}

export interface ChatResponse {
  message: string;
  briefDiff?: Partial<DesignBrief>;
  fullBrief?: DesignBrief;
  options?: string[];
}

export interface RenderRecord {
  id: string;
  projectId: string;
  roomType: string;
  roomLabel: string;
  imageUrl: string;
  prompt: string;
  resolution: string;
  createdAt: string;
}

export interface FurnitureTemplate {
  id: string;
  name: string;
  category: string;
  styleTag?: string;
  roomType: string;
  furniture: FurnitureItem[];
  thumbnailUrl?: string;
}

export interface FurnitureItem {
  type: string;
  label: string;
  modelUrl: string;
  category: string;
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
  defaultScale: [number, number, number];
  dimensions: [number, number, number];
  wallAnchor: 'against' | 'facing' | 'center' | null;
  floorOnly: boolean;
  minClearance: number;
}
