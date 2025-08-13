export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

import { i18n } from '../../i18n';

export class ApiService {
  // 以 Vite 環境變數為主，Fallback 到 8081（本機後端預設啟動埠）
  private static baseURL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
    || (process.env.REACT_APP_API_BASE_URL as string | undefined)
    || '/api';
  
  // 獲取當前存儲的 token
  private static getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  
  // 設置 token 到 localStorage
  private static setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
  
  // 移除 token
  private static removeToken(): void {
    localStorage.removeItem('authToken');
  }

  /**
   * 通用 API 請求方法
   * @param endpoint API 端點
   * @param options 請求選項
   * @returns Promise<T> 響應數據
   */
  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 若 endpoint 已包含 http 開頭，視為完整 URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Accept-Language': i18n?.language || 'en',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // 統一錯誤處理：丟出帶狀態碼的 ApiError，呼叫端可決定友善訊息
      if (!response.ok) {
        let errorData: any = {};
        try { errorData = await response.json(); } catch {}
        // 後端統一回傳 { success, message }，優先顯示 message
        const rawMessage = (errorData && (errorData.message || errorData.error || errorData.details))
          || `API Error: ${response.status} ${response.statusText}`;
        const message = ApiService.translateServerMessage(rawMessage);
        if (response.status === 401) this.removeToken();
        throw new ApiError(message, response.status, errorData);
      }
      
      // 允許空內容
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * 處理文件上傳的專用方法
   * @param endpoint API 端點
   * @param formData FormData 對象
   * @returns Promise<T> 響應數據
   */
  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      try { const err = JSON.parse(txt); throw new Error(err.message || `Upload Error: ${response.status}`); }
      catch { throw new Error(`Upload Error: ${response.status}`); }
    }
    const t = await response.text();
    return t ? JSON.parse(t) : ({} as T);
  }

  /**
   * 處理文件上傳並顯示進度的方法
   * @param endpoint API 端點
   * @param file 要上傳的文件
   * @param onProgress 進度回調函數
   * @returns Promise<T> 響應數據
   */
  static async uploadFileWithProgress<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
      const token = this.getToken();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));

      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  /**
   * 根據當前語言將後端訊息轉為使用者看得懂的在地化文字
   */
  private static translateServerMessage(message: string): string {
    const lang = i18n?.language || 'en';
    const isZh = lang.startsWith('zh');

    // 快速對應常見錯誤
    const maps: Array<{ zh: RegExp; en: string; zhOut?: string }> = [
      { zh: /用戶名或密碼錯誤|認證失敗/, en: 'Invalid username or password.', zhOut: '用戶名或密碼錯誤' },
      { zh: /登入失敗[:：]?\s*憑證錯誤|憑證錯誤/, en: 'Invalid username or password.', zhOut: '用戶名或密碼錯誤' },
      { zh: /使用者名稱不存在|用戶名不存在/, en: 'Username does not exist.', zhOut: '使用者名稱不存在' },
      { zh: /用戶名長度必須在3-50個字符之間/, en: 'Username must be between 3 and 50 characters.', zhOut: '用戶名長度必須在3-50個字元之間' },
      { zh: /密碼長度至少6個字符/, en: 'Password must be at least 6 characters.', zhOut: '密碼長度至少 6 個字元' },
      { zh: /郵箱格式不正確|郵箱格式不正确/, en: 'Invalid email format.', zhOut: '電子郵件格式不正確' },
      { zh: /用戶名.*已存在|使用者名稱.*已存在|帳號.*已存在/, en: 'Username already exists.', zhOut: '使用者名稱已存在' },
      { zh: /郵箱.*已被使用|郵箱已存在|電子郵件.*已被使用|電子郵件.*已存在/, en: 'Email already exists.', zhOut: '電子郵件已被使用' },
      { zh: /密碼確認不匹配/, en: 'Passwords do not match.', zhOut: '兩次密碼輸入不一致' },
    ];

    for (const m of maps) {
      if (m.zh.test(message)) {
        return isZh ? (m.zhOut || message) : m.en;
      }
    }

    // 預設回傳原始訊息或英文包裝
    if (isZh) return message;
    // 簡單將部份關鍵字翻譯
    if (/錯誤|失敗/.test(message)) return 'Request failed. Please try again.';
    return message;
  }

  // Blog Post API methods
  static async getPosts() {
    return this.request<any[]>('/content/posts');
  }

  static async getPost(id: string) {
    return this.request<any>(`/content/posts/${id}`);
  }

  static async createPost(postData: any) {
    return this.request<any>('/content/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  static async updatePost(id: string, postData: any) {
    return this.request<any>(`/content/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  }

  static async deletePost(id: string) {
    return this.request<void>(`/content/posts/${id}`, {
      method: 'DELETE'
    });
  }

  // Portfolio API methods
  static async getPortfolio() {
    return this.request<any[]>('/content/portfolio');
  }

  static async getPortfolioItem(id: string) {
    return this.request<any>(`/content/portfolio/${id}`);
  }

  static async createPortfolioItem(itemData: any) {
    return this.request<any>('/content/portfolio', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  static async updatePortfolioItem(id: string, itemData: any) {
    return this.request<any>(`/content/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  }

  static async deletePortfolioItem(id: string) {
    return this.request<void>(`/content/portfolio/${id}`, {
      method: 'DELETE'
    });
  }

  // Comment API methods
  static async getCommentsByPost(postId: string) {
    return this.request<any[]>(`/comments/post/${postId}`);
  }

  static async addComment(payload: { postId: string; text: string; parentId?: string | null }) {
    return this.request<any>('/comments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async deleteComment(id: string) {
    return this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }
} 