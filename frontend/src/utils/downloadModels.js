import * as faceapi from 'face-api.js';

export async function downloadFaceApiModels() {
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      // Optionally load other models if needed:
      // faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    // Save models to IndexedDB for offline use
    const modelFiles = [
      'tiny_face_detector_model-shard1',
      'tiny_face_detector_model-weights_manifest.json'
    ];
    
    for (const fileName of modelFiles) {
      const response = await fetch(`${MODEL_URL}/${fileName}`);
      const blob = await response.blob();
      
      // Save to public/models using File System Access AaPI
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Model Files',
          accept: {
            'application/octet-stream': ['.json', '*']
          },
        }],
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    }
    
    console.log('Face-api models downloaded successfully');
  } catch (error) {
    console.error('Error downloading face-api models:', error);
    throw error;
  }
} 