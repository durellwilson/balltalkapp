import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Define the metrics interface
interface AudioMetrics {
  loudness: number;
  dynamics: number;
  stereoWidth: number;
  spectralBalance: {
    low: number;
    mid: number;
    high: number;
  };
  signalToNoiseRatio?: number;
  peakLevel?: number;
  truepeakLevel?: number;
  clippingPercentage?: number;
}

interface AudioAnalysisVisualizationProps {
  metrics: AudioMetrics;
  title?: string;
  showAdvancedMetrics?: boolean;
}

const AudioAnalysisVisualization: React.FC<AudioAnalysisVisualizationProps> = ({
  metrics,
  title = 'Audio Analysis',
  showAdvancedMetrics = false,
}) => {
  // Normalize loudness value to a percentage (typical range: -30 to 0 LUFS)
  const normalizeLoudness = (value: number): number => {
    // Convert from LUFS (-30 to 0) to percentage (0 to 100)
    return Math.min(100, Math.max(0, ((value + 30) / 30) * 100));
  };

  // Normalize dynamics value to a percentage (typical range: 0 to 20 dB)
  const normalizeDynamics = (value: number): number => {
    // Convert from dB (0 to 20) to percentage (0 to 100)
    return Math.min(100, Math.max(0, (value / 20) * 100));
  };

  // Normalize stereo width value to a percentage (typical range: 0 to 1)
  const normalizeStereoWidth = (value: number): number => {
    // Convert from 0-1 to percentage (0 to 100)
    return Math.min(100, Math.max(0, value * 100));
  };

  // Normalize signal-to-noise ratio (typical range: 0 to 100 dB)
  const normalizeSignalToNoiseRatio = (value: number): number => {
    // Convert from dB (0 to 100) to percentage (0 to 100)
    return Math.min(100, Math.max(0, value));
  };

  // Get color based on percentage value
  const getColorForPercentage = (percentage: number): string => {
    if (percentage < 30) {
      return '#FF3B30'; // Red for low values
    } else if (percentage < 70) {
      return '#FFCC00'; // Yellow for medium values
    } else {
      return '#34C759'; // Green for high values
    }
  };

  // Get color for spectral balance
  const getSpectralBalanceColor = (value: number): string => {
    if (value < 0.2) {
      return '#FF3B30'; // Red for very low
    } else if (value < 0.3) {
      return '#FF9500'; // Orange for low
    } else if (value < 0.4) {
      return '#FFCC00'; // Yellow for medium-low
    } else if (value < 0.6) {
      return '#34C759'; // Green for balanced
    } else if (value < 0.7) {
      return '#FFCC00'; // Yellow for medium-high
    } else if (value < 0.8) {
      return '#FF9500'; // Orange for high
    } else {
      return '#FF3B30'; // Red for very high
    }
  };

  // Render a meter with a label
  const renderMeter = (label: string, value: number, normalizedValue: number, unit: string = '%') => {
    const color = getColorForPercentage(normalizedValue);
    
    return (
      <View style={styles.meterContainer}>
        <Text style={styles.meterLabel}>{label}</Text>
        <View style={styles.meterBarContainer}>
          <View 
            style={[
              styles.meterBar, 
              { width: `${normalizedValue}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.meterValue}>{value.toFixed(1)} {unit}</Text>
      </View>
    );
  };

  // Render spectral balance visualization
  const renderSpectralBalance = () => {
    const { low, mid, high } = metrics.spectralBalance;
    
    return (
      <View style={styles.spectralBalanceContainer}>
        <Text style={styles.meterLabel}>Spectral Balance</Text>
        <View style={styles.spectralBarsContainer}>
          <View style={styles.spectralBarGroup}>
            <View 
              style={[
                styles.spectralBar, 
                { height: `${low * 100}%`, backgroundColor: getSpectralBalanceColor(low) }
              ]} 
            />
            <Text style={styles.spectralBarLabel}>Low</Text>
          </View>
          <View style={styles.spectralBarGroup}>
            <View 
              style={[
                styles.spectralBar, 
                { height: `${mid * 100}%`, backgroundColor: getSpectralBalanceColor(mid) }
              ]} 
            />
            <Text style={styles.spectralBarLabel}>Mid</Text>
          </View>
          <View style={styles.spectralBarGroup}>
            <View 
              style={[
                styles.spectralBar, 
                { height: `${high * 100}%`, backgroundColor: getSpectralBalanceColor(high) }
              ]} 
            />
            <Text style={styles.spectralBarLabel}>High</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render advanced metrics
  const renderAdvancedMetrics = () => {
    if (!showAdvancedMetrics) return null;
    
    return (
      <View style={styles.advancedMetricsContainer}>
        <Text style={styles.sectionTitle}>Advanced Metrics</Text>
        
        {metrics.signalToNoiseRatio !== undefined && (
          renderMeter(
            'Signal-to-Noise Ratio', 
            metrics.signalToNoiseRatio, 
            normalizeSignalToNoiseRatio(metrics.signalToNoiseRatio),
            'dB'
          )
        )}
        
        {metrics.peakLevel !== undefined && (
          renderMeter(
            'Peak Level', 
            metrics.peakLevel, 
            normalizeLoudness(metrics.peakLevel),
            'dB'
          )
        )}
        
        {metrics.truepeakLevel !== undefined && (
          renderMeter(
            'True Peak Level', 
            metrics.truepeakLevel, 
            normalizeLoudness(metrics.truepeakLevel),
            'dB'
          )
        )}
        
        {metrics.clippingPercentage !== undefined && (
          renderMeter(
            'Clipping', 
            metrics.clippingPercentage * 100, 
            100 - (metrics.clippingPercentage * 100),
            '%'
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.metricsContainer}>
        {renderMeter(
          'Loudness', 
          metrics.loudness, 
          normalizeLoudness(metrics.loudness),
          'LUFS'
        )}
        
        {renderMeter(
          'Dynamics', 
          metrics.dynamics, 
          normalizeDynamics(metrics.dynamics),
          'dB'
        )}
        
        {renderMeter(
          'Stereo Width', 
          metrics.stereoWidth * 100, 
          normalizeStereoWidth(metrics.stereoWidth),
          '%'
        )}
        
        {renderSpectralBalance()}
      </View>
      
      {renderAdvancedMetrics()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  meterContainer: {
    marginBottom: 12,
  },
  meterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666666',
  },
  meterBarContainer: {
    height: 12,
    backgroundColor: '#F2F2F2',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  meterBar: {
    height: '100%',
    borderRadius: 6,
  },
  meterValue: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  spectralBalanceContainer: {
    marginTop: 16,
  },
  spectralBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    marginTop: 8,
  },
  spectralBarGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  spectralBar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  spectralBarLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    color: '#333333',
  },
  advancedMetricsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
});

export default AudioAnalysisVisualization; 