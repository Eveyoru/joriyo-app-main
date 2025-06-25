import { getBaseUrl, apiRequest, getFullImageUrl } from '@/utils/api';

export interface Banner {
  _id: string;
  title: string;
  image: string;
  description?: string;
  url?: string;
  isActive: boolean;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface BannerApiResponse {
  data: Banner[];
  success: boolean;
  message?: string;
  error: boolean;
}

// Get active banners
export async function getBanners(): Promise<Banner[]> {
  try {
    // Make sure we use the full path including the leading slash
    const response = await apiRequest<BannerApiResponse>('/api/banner/get-active');
    
    if (!response.success) {
      console.warn('Banner fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched banners:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}
