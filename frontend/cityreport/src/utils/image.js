import { getApiBaseUrl } from '../api';

const DEFAULT_ROAD_IMAGE = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80';

export const getImageUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return DEFAULT_ROAD_IMAGE;
    }

    const trimmed = url.trim();

    // Already fully qualified URL, data URI, or blob URL
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }

    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    return `${baseUrl}${relativePath}`;
};

export default getImageUrl;
