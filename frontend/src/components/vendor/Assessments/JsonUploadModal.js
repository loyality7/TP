import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { testService } from '../../../services/test.service';

const JsonUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setJsonData(JSON.stringify(json, null, 2));
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const parsedData = JSON.parse(jsonData);
      const response = await testService.createTest(parsedData);
      
      if (response.status === 201) {
        toast.success('Test created successfully!');
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error(error.response?.data?.error || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Test JSON</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="jsonFile"
            />
            <label
              htmlFor="jsonFile"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Click to upload JSON file or paste JSON below
              </span>
            </label>
          </div>

          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder="Paste your JSON here..."
            className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!jsonData || loading}
              className={`px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonUploadModal; 