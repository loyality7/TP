import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/Card';
import { Shield, Clock, Users, Eye, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { testService } from '../../../../services/test.service';

const SettingsTab = ({ testData, setTestData, testId }) => {
  const handleSettingUpdate = async (category, setting, value) => {
    try {
      const updatedSettings = {
        ...testData.settings,
        [category]: {
          ...testData.settings[category],
          [setting]: value
        }
      };

      if (testId) {
        await testService.updateTest(testId, {
          settings: updatedSettings
        });
      }

      setTestData(prev => ({
        ...prev,
        settings: updatedSettings
      }));

      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Proctoring Settings */}
      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Proctoring Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Proctoring</h4>
                <p className="text-sm text-gray-500">Monitor candidates during the test</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={testData.settings?.proctoring?.enabled}
                  onChange={(e) => handleSettingUpdate('proctoring', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {testData.settings?.proctoring?.enabled && (
              <div className="space-y-3 pl-4 border-l-2 border-emerald-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="webcam"
                    checked={testData.settings?.proctoring?.webcam}
                    onChange={(e) => handleSettingUpdate('proctoring', 'webcam', e.target.checked)}
                    className="h-4 w-4 text-emerald-500 rounded border-gray-300"
                  />
                  <label htmlFor="webcam" className="text-sm">Require webcam access</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="screen"
                    checked={testData.settings?.proctoring?.screen}
                    onChange={(e) => handleSettingUpdate('proctoring', 'screen', e.target.checked)}
                    className="h-4 w-4 text-emerald-500 rounded border-gray-300"
                  />
                  <label htmlFor="screen" className="text-sm">Enable screen sharing</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recording"
                    checked={testData.settings?.proctoring?.recording}
                    onChange={(e) => handleSettingUpdate('proctoring', 'recording', e.target.checked)}
                    className="h-4 w-4 text-emerald-500 rounded border-gray-300"
                  />
                  <label htmlFor="recording" className="text-sm">Record test session</label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Management */}
      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            Time Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Duration (minutes)</label>
              <input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData({ ...testData, duration: e.target.value })}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="timePerQuestion"
                checked={testData.settings?.timing?.timePerQuestion}
                onChange={(e) => handleSettingUpdate('timing', 'timePerQuestion', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="timePerQuestion" className="text-sm">Set time limit per question</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Test Access</label>
              <select
                value={testData.settings?.access?.type}
                onChange={(e) => handleSettingUpdate('access', 'type', e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="private">Private (Invitation Only)</option>
                <option value="public">Public</option>
                <option value="domain">Domain Restricted</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireRegistration"
                checked={testData.settings?.access?.requireRegistration}
                onChange={(e) => handleSettingUpdate('access', 'requireRegistration', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="requireRegistration" className="text-sm">Require pre-registration</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Settings */}
      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-500" />
            Result Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showResults"
                checked={testData.settings?.results?.showResults}
                onChange={(e) => handleSettingUpdate('results', 'showResults', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="showResults" className="text-sm">Show results immediately</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showAnswers"
                checked={testData.settings?.results?.showAnswers}
                onChange={(e) => handleSettingUpdate('results', 'showAnswers', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="showAnswers" className="text-sm">Show correct answers</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowReview"
                checked={testData.settings?.results?.allowReview}
                onChange={(e) => handleSettingUpdate('results', 'allowReview', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="allowReview" className="text-sm">Allow answer review</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-500" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                checked={testData.settings?.advanced?.randomizeQuestions}
                onChange={(e) => handleSettingUpdate('advanced', 'randomizeQuestions', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="randomizeQuestions" className="text-sm">Randomize question order</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="preventCopy"
                checked={testData.settings?.advanced?.preventCopy}
                onChange={(e) => handleSettingUpdate('advanced', 'preventCopy', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="preventCopy" className="text-sm">Prevent copy/paste</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negativeMarking"
                checked={testData.settings?.advanced?.negativeMarking}
                onChange={(e) => handleSettingUpdate('advanced', 'negativeMarking', e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded border-gray-300"
              />
              <label htmlFor="negativeMarking" className="text-sm">Enable negative marking</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab; 