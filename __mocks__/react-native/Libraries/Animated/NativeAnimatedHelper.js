export const API = {
  startOperationBatch: jest.fn(),
  finishOperationBatch: jest.fn(),
  createAnimatedNode: jest.fn(),
  getValue: jest.fn(),
  startListeningToAnimatedNodeValue: jest.fn(),
  stopListeningToAnimatedNodeValue: jest.fn(),
  connectAnimatedNodes: jest.fn(),
  disconnectAnimatedNodes: jest.fn(),
  startAnimatingNode: jest.fn(),
  stopAnimation: jest.fn(),
  setAnimatedNodeValue: jest.fn(),
  setAnimatedNodeOffset: jest.fn(),
  flattenAnimatedNodeOffset: jest.fn(),
  extractAnimatedNodeOffset: jest.fn(),
  connectAnimatedNodeToView: jest.fn(),
  disconnectAnimatedNodeFromView: jest.fn(),
  restoreDefaultValues: jest.fn(),
  dropAnimatedNode: jest.fn(),
  addAnimatedEventToView: jest.fn(),
  removeAnimatedEventFromView: jest.fn(),
};

export default {
  API,
  nativeEventEmitter: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  nativeRequireModuleConfig: jest.fn(),
  shouldUseNativeDriver: jest.fn(() => false),
  isNativeAnimatedAvailable: jest.fn(() => false),
}; 