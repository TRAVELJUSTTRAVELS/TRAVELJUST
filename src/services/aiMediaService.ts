/**
 * AI Generative Media Service
 * Integrates:
 * 1. Veo Video Generation (veo-3.1-fast-generate-preview) with 16:9 and 9:16 aspect ratios
 * 2. Image Creation & Editing (gemini-3.1-flash-image-preview)
 */

export interface VideoGenerationJob {
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  videoUrl?: string;
  errorMessage?: string;
}

export async function generateVeoVideo(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  base64Image?: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; operationName?: string; error?: string }> {
  try {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio,
        base64Image,
        mimeType,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to start video generation');
    }
    return { success: true, operationName: data.operationName };
  } catch (err: any) {
    console.error('generateVeoVideo error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function pollVeoVideoStatus(
  operationName: string
): Promise<{ success: boolean; done: boolean; error?: string; elapsedSeconds?: number }> {
  try {
    const res = await fetch('/api/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName }),
    });
    const data = await res.json();
    return {
      success: true,
      done: Boolean(data.done),
      error: data.error,
      elapsedSeconds: data.elapsedSeconds,
    };
  } catch (err: any) {
    console.warn('pollVeoVideoStatus error:', err);
    return { success: false, done: false, error: err.message };
  }
}

export async function downloadVeoVideo(
  operationName: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/video-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName, aspectRatio }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.videoUrl) {
      throw new Error(data.error || 'Could not download generated video');
    }
    return { success: true, videoUrl: data.videoUrl };
  } catch (err: any) {
    console.error('downloadVeoVideo error:', err);
    return { success: false, error: err.message || 'Failed to fetch video file' };
  }
}

export async function createAiImage(
  prompt: string,
  aspectRatio: '16:9' | '1:1' | '9:16' = '16:9'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.imageUrl) {
      throw new Error(data.error || 'Failed to generate image');
    }
    return { success: true, imageUrl: data.imageUrl };
  } catch (err: any) {
    console.error('createAiImage error:', err);
    return { success: false, error: err.message || 'Image generation failed' };
  }
}

export async function editAiImage(
  prompt: string,
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, base64Image, mimeType }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.imageUrl) {
      throw new Error(data.error || 'Failed to edit image');
    }
    return { success: true, imageUrl: data.imageUrl };
  } catch (err: any) {
    console.error('editAiImage error:', err);
    return { success: false, error: err.message || 'Image editing failed' };
  }
}
