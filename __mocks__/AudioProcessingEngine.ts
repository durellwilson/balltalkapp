// Mock for AudioProcessingEngine
class MockAudioProcessingEngine {
  initialize() {
    return Promise.resolve(true);
  }
  
  loadAudio(uri: string) {
    return Promise.resolve(true);
  }
  
  play() {
    return Promise.resolve(true);
  }
  
  pause() {
    return Promise.resolve(true);
  }
  
  stop() {
    return Promise.resolve(true);
  }
  
  setPosition(position: number) {
    return Promise.resolve(true);
  }
  
  getPosition() {
    return Promise.resolve(0);
  }
  
  getDuration() {
    return Promise.resolve(1000);
  }
  
  isPlaying() {
    return Promise.resolve(false);
  }
  
  addModule(module: any) {
    return Promise.resolve(true);
  }
  
  removeModule(moduleId: string) {
    return Promise.resolve(true);
  }
  
  getModules() {
    return Promise.resolve([]);
  }
  
  processAudio(options: any) {
    return Promise.resolve({
      uri: 'file://processed-audio.mp3',
      duration: 1000
    });
  }
}

export default MockAudioProcessingEngine; 