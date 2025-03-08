import { getAnalytics, logEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';

// Get the Firebase Analytics instance
const getAnalyticsInstance = () => {
  try {
    const app = getApp();
    return getAnalytics(app);
  } catch (error) {
    console.error('Error getting analytics instance:', error);
    return null;
  }
};

export const trackAudioProcessing = async (
  processingType: 'mastering' | 'vocal',
  duration: number,
  success: boolean,
  options?: any
) => {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  
  logEvent(analytics, 'audio_processing', {
    processing_type: processingType,
    duration_seconds: duration,
    success,
    options: JSON.stringify(options)
  });
};

export const trackPresetUsage = async (
  presetId: string,
  presetName: string,
  presetType: 'mastering' | 'vocal'
) => {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  
  logEvent(analytics, 'preset_usage', {
    preset_id: presetId,
    preset_name: presetName,
    preset_type: presetType
  });
};
