/**
 * Test script for Web Audio API implementation
 * 
 * This script creates a simple HTML page that tests the Web Audio API
 * implementation in the AudioProcessingService.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// Function to open URL in default browser
function openBrowser(url) {
  let command;
  switch (process.platform) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
      break;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open browser: ${error}`);
    }
  });
}

// Create a simple HTML page for testing
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Audio API Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    button {
      padding: 10px 15px;
      margin: 5px;
      background-color: #007AFF;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:disabled {
      background-color: #cccccc;
    }
    .progress {
      width: 100%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 5px;
      margin: 10px 0;
    }
    .progress-bar {
      height: 100%;
      background-color: #007AFF;
      border-radius: 5px;
      width: 0%;
      transition: width 0.3s;
    }
    .log {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
      height: 200px;
      overflow-y: auto;
      margin-top: 20px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>Web Audio API Test</h1>
  
  <div>
    <h2>Test Audio</h2>
    <audio id="original-audio" controls src="/test-tone.wav"></audio>
  </div>
  
  <div>
    <h2>Effects</h2>
    <div>
      <label>
        <input type="checkbox" id="normalize" checked> Normalize
      </label>
      <label>
        <input type="checkbox" id="compression" checked> Compression
      </label>
      <label>
        <input type="checkbox" id="eq" checked> EQ
      </label>
      <label>
        <input type="checkbox" id="reverb"> Reverb
      </label>
      <label>
        <input type="checkbox" id="fade-in"> Fade In
      </label>
      <label>
        <input type="checkbox" id="fade-out"> Fade Out
      </label>
    </div>
  </div>
  
  <div>
    <h2>Parameters</h2>
    <div>
      <label>Compression Threshold: <input type="range" id="compression-threshold" min="-60" max="0" value="-24"> <span id="compression-threshold-value">-24 dB</span></label>
    </div>
    <div>
      <label>Compression Ratio: <input type="range" id="compression-ratio" min="1" max="20" value="4"> <span id="compression-ratio-value">4:1</span></label>
    </div>
    <div>
      <label>EQ Low: <input type="range" id="eq-low" min="-12" max="12" value="0"> <span id="eq-low-value">0 dB</span></label>
    </div>
    <div>
      <label>EQ Mid: <input type="range" id="eq-mid" min="-12" max="12" value="0"> <span id="eq-mid-value">0 dB</span></label>
    </div>
    <div>
      <label>EQ High: <input type="range" id="eq-high" min="-12" max="12" value="0"> <span id="eq-high-value">0 dB</span></label>
    </div>
    <div>
      <label>Reverb Amount: <input type="range" id="reverb-amount" min="0" max="1" step="0.01" value="0.3"> <span id="reverb-amount-value">0.3</span></label>
    </div>
    <div>
      <label>Fade In Duration: <input type="range" id="fade-in-duration" min="0" max="5" step="0.1" value="1"> <span id="fade-in-duration-value">1.0 s</span></label>
    </div>
    <div>
      <label>Fade Out Duration: <input type="range" id="fade-out-duration" min="0" max="5" step="0.1" value="1"> <span id="fade-out-duration-value">1.0 s</span></label>
    </div>
  </div>
  
  <div>
    <h2>Process Audio</h2>
    <button id="process-button">Process Audio</button>
    <div class="progress">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
  </div>
  
  <div>
    <h2>Processed Audio</h2>
    <audio id="processed-audio" controls></audio>
  </div>
  
  <div class="log" id="log"></div>
  
  <script>
    // Simple logger
    function log(message) {
      const logElement = document.getElementById('log');
      const logEntry = document.createElement('div');
      logEntry.textContent = message;
      logElement.appendChild(logEntry);
      logElement.scrollTop = logElement.scrollHeight;
    }
    
    // Update parameter value displays
    document.getElementById('compression-threshold').addEventListener('input', function() {
      document.getElementById('compression-threshold-value').textContent = this.value + ' dB';
    });
    
    document.getElementById('compression-ratio').addEventListener('input', function() {
      document.getElementById('compression-ratio-value').textContent = this.value + ':1';
    });
    
    document.getElementById('eq-low').addEventListener('input', function() {
      document.getElementById('eq-low-value').textContent = this.value + ' dB';
    });
    
    document.getElementById('eq-mid').addEventListener('input', function() {
      document.getElementById('eq-mid-value').textContent = this.value + ' dB';
    });
    
    document.getElementById('eq-high').addEventListener('input', function() {
      document.getElementById('eq-high-value').textContent = this.value + ' dB';
    });
    
    document.getElementById('reverb-amount').addEventListener('input', function() {
      document.getElementById('reverb-amount-value').textContent = this.value;
    });
    
    document.getElementById('fade-in-duration').addEventListener('input', function() {
      document.getElementById('fade-in-duration-value').textContent = this.value + ' s';
    });
    
    document.getElementById('fade-out-duration').addEventListener('input', function() {
      document.getElementById('fade-out-duration-value').textContent = this.value + ' s';
    });
    
    // Process audio button
    document.getElementById('process-button').addEventListener('click', async function() {
      const processButton = document.getElementById('process-button');
      const progressBar = document.getElementById('progress-bar');
      const originalAudio = document.getElementById('original-audio');
      const processedAudio = document.getElementById('processed-audio');
      
      if (!originalAudio.src) {
        log('Error: No audio source found');
        return;
      }
      
      try {
        processButton.disabled = true;
        progressBar.style.width = '0%';
        log('Starting audio processing...');
        
        // Get effect settings
        const effects = {
          normalize: document.getElementById('normalize').checked,
          compression: document.getElementById('compression').checked,
          eq: document.getElementById('eq').checked,
          reverb: document.getElementById('reverb').checked,
          fadeIn: document.getElementById('fade-in').checked,
          fadeOut: document.getElementById('fade-out').checked
        };
        
        // Get parameter settings
        const parameters = {
          compressionThreshold: parseInt(document.getElementById('compression-threshold').value),
          compressionRatio: parseInt(document.getElementById('compression-ratio').value),
          eqLow: parseInt(document.getElementById('eq-low').value),
          eqMid: parseInt(document.getElementById('eq-mid').value),
          eqHigh: parseInt(document.getElementById('eq-high').value),
          reverbAmount: parseFloat(document.getElementById('reverb-amount').value),
          fadeInDuration: parseFloat(document.getElementById('fade-in-duration').value),
          fadeOutDuration: parseFloat(document.getElementById('fade-out-duration').value)
        };
        
        log('Effects: ' + JSON.stringify(effects));
        log('Parameters: ' + JSON.stringify(parameters));
        
        // Process audio using Web Audio API
        await processAudio(originalAudio.src, effects, parameters, (progress) => {
          progressBar.style.width = (progress * 100) + '%';
        });
        
      } catch (error) {
        log('Error: ' + error.message);
      } finally {
        processButton.disabled = false;
      }
    });
    
    // Audio processing function
    async function processAudio(audioUri, effects, parameters, onProgress) {
      try {
        // Fetch the audio data
        log('Fetching audio data...');
        const response = await fetch(audioUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Create AudioContext
        log('Creating AudioContext...');
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Decode the audio data
        log('Decoding audio data...');
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        log('Audio decoded successfully: ' + 
          audioBuffer.numberOfChannels + ' channels, ' + 
          audioBuffer.sampleRate + ' Hz, ' + 
          audioBuffer.duration.toFixed(2) + ' seconds');
        
        onProgress(0.2);
        
        // Create an offline context for processing
        log('Creating offline context for processing...');
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Create source node
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create a chain of audio nodes for processing
        let currentNode = source;
        const steps = Object.values(effects).filter(Boolean).length;
        const stepSize = steps > 0 ? 0.6 / steps : 0.6;
        let currentProgress = 0.2;
        
        // Apply normalization if enabled
        if (effects.normalize) {
          log('Applying normalization...');
          // Find the maximum amplitude
          let maxValue = 0;
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
              const absValue = Math.abs(channelData[i]);
              if (absValue > maxValue) {
                maxValue = absValue;
              }
            }
          }
          
          // Calculate the gain factor
          const gainFactor = maxValue > 0 ? 0.99 / maxValue : 1.0;
          log('Normalization gain factor: ' + gainFactor.toFixed(2));
          
          // Create a gain node for normalization
          const normalizeGain = offlineContext.createGain();
          normalizeGain.gain.value = gainFactor;
          
          currentNode.connect(normalizeGain);
          currentNode = normalizeGain;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
        }
        
        // Apply compression if enabled
        if (effects.compression) {
          log('Applying compression...');
          const compressor = offlineContext.createDynamicsCompressor();
          compressor.threshold.value = parameters.compressionThreshold;
          compressor.ratio.value = parameters.compressionRatio;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          compressor.knee.value = 30;
          
          currentNode.connect(compressor);
          currentNode = compressor;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
        }
        
        // Apply EQ if enabled
        if (effects.eq) {
          log('Applying EQ...');
          // Low shelf filter
          const lowShelf = offlineContext.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 320;
          lowShelf.gain.value = parameters.eqLow;
          
          // Mid peaking filter
          const midPeak = offlineContext.createBiquadFilter();
          midPeak.type = 'peaking';
          midPeak.frequency.value = 1000;
          midPeak.Q.value = 1;
          midPeak.gain.value = parameters.eqMid;
          
          // High shelf filter
          const highShelf = offlineContext.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.value = 3200;
          highShelf.gain.value = parameters.eqHigh;
          
          currentNode.connect(lowShelf);
          lowShelf.connect(midPeak);
          midPeak.connect(highShelf);
          currentNode = highShelf;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
        }
        
        // Apply reverb if enabled
        if (effects.reverb) {
          log('Applying reverb...');
          // Create convolver node for reverb
          const convolver = offlineContext.createConvolver();
          
          // Generate impulse response for reverb
          const reverbAmount = parameters.reverbAmount;
          const impulseLength = offlineContext.sampleRate * reverbAmount;
          const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);
          
          // Fill impulse buffer with decaying noise
          for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const impulseData = impulse.getChannelData(channel);
            for (let i = 0; i < impulseLength; i++) {
              impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
            }
          }
          
          convolver.buffer = impulse;
          
          // Create a gain node to control reverb mix
          const reverbGain = offlineContext.createGain();
          reverbGain.gain.value = reverbAmount;
          
          // Create a gain node for dry signal
          const dryGain = offlineContext.createGain();
          dryGain.gain.value = 1 - reverbAmount;
          
          // Split the signal
          currentNode.connect(convolver);
          currentNode.connect(dryGain);
          
          // Connect reverb through its gain
          convolver.connect(reverbGain);
          
          // Create a merger node
          const merger = offlineContext.createGain();
          reverbGain.connect(merger);
          dryGain.connect(merger);
          
          currentNode = merger;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
        }
        
        // Connect the final node to the destination
        currentNode.connect(offlineContext.destination);
        
        // Start the source
        source.start(0);
        
        // Render the audio
        log('Rendering processed audio...');
        onProgress(0.8);
        const renderedBuffer = await offlineContext.startRendering();
        
        // Apply fades directly to the rendered buffer if needed
        let processedBuffer = renderedBuffer;
        
        // Apply fade in if enabled
        if (effects.fadeIn) {
          log('Applying fade in...');
          const fadeInDuration = parameters.fadeInDuration;
          const numSamples = Math.min(Math.floor(fadeInDuration * processedBuffer.sampleRate), processedBuffer.length);
          
          // Create a new buffer with the same properties
          const newBuffer = offlineContext.createBuffer(
            processedBuffer.numberOfChannels,
            processedBuffer.length,
            processedBuffer.sampleRate
          );
          
          // Process each channel
          for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
            const channelData = processedBuffer.getChannelData(channel);
            const newChannelData = new Float32Array(processedBuffer.length);
            
            // Copy the data
            newChannelData.set(channelData);
            
            // Apply fade in
            for (let i = 0; i < numSamples; i++) {
              const gain = i / numSamples;
              newChannelData[i] *= gain;
            }
            
            newBuffer.copyToChannel(newChannelData, channel);
          }
          
          processedBuffer = newBuffer;
        }
        
        // Apply fade out if enabled
        if (effects.fadeOut) {
          log('Applying fade out...');
          const fadeOutDuration = parameters.fadeOutDuration;
          const numSamples = Math.min(Math.floor(fadeOutDuration * processedBuffer.sampleRate), processedBuffer.length);
          const startIndex = processedBuffer.length - numSamples;
          
          // Create a new buffer with the same properties
          const newBuffer = offlineContext.createBuffer(
            processedBuffer.numberOfChannels,
            processedBuffer.length,
            processedBuffer.sampleRate
          );
          
          // Process each channel
          for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
            const channelData = processedBuffer.getChannelData(channel);
            const newChannelData = new Float32Array(processedBuffer.length);
            
            // Copy the data
            newChannelData.set(channelData);
            
            // Apply fade out
            for (let i = 0; i < numSamples; i++) {
              const gain = 1 - (i / numSamples);
              newChannelData[startIndex + i] *= gain;
            }
            
            newBuffer.copyToChannel(newChannelData, channel);
          }
          
          processedBuffer = newBuffer;
        }
        
        // Convert the processed buffer to WAV
        log('Converting to WAV format...');
        const wavData = audioBufferToWav(processedBuffer);
        const wavBlob = new Blob([wavData], { type: 'audio/wav' });
        
        // Create a URL for the processed audio
        const processedUrl = URL.createObjectURL(wavBlob);
        
        // Update the audio element
        const processedAudio = document.getElementById('processed-audio');
        processedAudio.src = processedUrl;
        
        onProgress(1.0);
        log('Processing complete!');
        
        // Clean up
        audioContext.close();
      } catch (error) {
        log('Error processing audio: ' + error.message);
        throw error;
      }
    }
    
    // Convert AudioBuffer to WAV format
    function audioBufferToWav(buffer) {
      const numOfChannels = buffer.numberOfChannels;
      const length = buffer.length * numOfChannels * 2;
      const sampleRate = buffer.sampleRate;
      const wavDataView = new DataView(new ArrayBuffer(44 + length));
      
      // Write WAV header
      writeWavHeader(wavDataView, numOfChannels, sampleRate, buffer.length);
      
      // Write audio data
      let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
          const sample = buffer.getChannelData(channel)[i];
          // Convert float to 16-bit PCM
          const value = Math.max(-1, Math.min(1, sample));
          const pcmValue = value < 0 ? value * 0x8000 : value * 0x7FFF;
          wavDataView.setInt16(offset, pcmValue, true);
          offset += 2;
        }
      }
      
      return wavDataView.buffer;
    }
    
    // Write WAV header to DataView
    function writeWavHeader(view, numChannels, sampleRate, numSamples) {
      const bytesPerSample = 2;
      const blockAlign = numChannels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = numSamples * blockAlign;
      
      // RIFF identifier
      writeString(view, 0, 'RIFF');
      // File length minus RIFF identifier and file size field
      view.setUint32(4, 36 + dataSize, true);
      // RIFF type
      writeString(view, 8, 'WAVE');
      // Format chunk identifier
      writeString(view, 12, 'fmt ');
      // Format chunk length
      view.setUint32(16, 16, true);
      // Sample format (1 is PCM)
      view.setUint16(20, 1, true);
      // Channel count
      view.setUint16(22, numChannels, true);
      // Sample rate
      view.setUint32(24, sampleRate, true);
      // Byte rate (sample rate * block align)
      view.setUint32(28, byteRate, true);
      // Block align (channel count * bytes per sample)
      view.setUint16(32, blockAlign, true);
      // Bits per sample
      view.setUint16(34, 8 * bytesPerSample, true);
      // Data chunk identifier
      writeString(view, 36, 'data');
      // Data chunk length
      view.setUint32(40, dataSize, true);
    }
    
    // Write string to DataView
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    // Log initialization
    log('Web Audio API Test initialized');
  </script>
</body>
</html>
`;

// Create a temporary HTML file
const tempHtmlPath = path.join(__dirname, 'web-audio-test.html');
fs.writeFileSync(tempHtmlPath, htmlContent);

// Copy test audio file to the script directory
const testAudioPath = path.join(__dirname, '../test-assets/test-tone.wav');
const testAudioDestPath = path.join(__dirname, 'test-tone.wav');
fs.copyFileSync(testAudioPath, testAudioDestPath);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.url === '/test-tone.wav') {
    const audioData = fs.readFileSync(testAudioDestPath);
    res.writeHead(200, { 'Content-Type': 'audio/wav' });
    res.end(audioData);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Opening browser...');
  
  // Open the browser
  openBrowser(`http://localhost:${PORT}/`);
  
  console.log('Press Ctrl+C to stop the server');
}); 