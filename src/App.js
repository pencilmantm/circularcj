import { Alert } from './components/Alert'; 
import { copyToClipboard } from './clipboardExport';
import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, GripHorizontal, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import './index.css';

const EMOTIONS = [
  { label: '😊 Delighted', value: 'delighted' },
  { label: '🙂 Satisfied', value: 'satisfied' },
  { label: '😐 Neutral', value: 'neutral' },
  { label: '😕 Confused', value: 'confused' },
  { label: '😟 Frustrated', value: 'frustrated' },
  { label: '😠 Angry', value: 'angry' },
  { label: '😢 Disappointed', value: 'disappointed' }
];

const EMOTIONS_ICONS = {
  delighted: '😊',
  satisfied: '🙂',
  neutral: '😐',
  confused: '😕',
  frustrated: '😟',
  angry: '😠',
  disappointed: '😢'
};

const EFFORT_LEVELS = [
  { label: '⚡ Very Easy', value: 'very-easy' },
  { label: '✨ Easy', value: 'easy' },
  { label: '🔄 Moderate', value: 'moderate' },
  { label: '⚠️ Difficult', value: 'difficult' },
  { label: '🛑 Very Difficult', value: 'very-difficult' }
];

const EFFORT_ICONS = {
  'very-easy': '⚡',
  'easy': '✨',
  'moderate': '🔄',
  'difficult': '⚠️',
  'very-difficult': '🛑'
};

function App() {
  const [persona, setPersona] = useState({
    name: 'Click to add persona name',
    description: 'Click to add persona description',
    imageTimestamp: Date.now()
  });

  const [stages, setStages] = useState([
    { 
      id: 1, 
      title: 'Edit stage name',
      emotion: 'neutral',
      effort: 'moderate',
      objectives: '',
      thoughts: '',
      actions: '',
      frictionPoints: '',
      momentsOfTruth: '',
      opportunities: ''
    }
  ]);
  
  const [touchpoints, setTouchpoints] = useState([]);
  const [draggedStage, setDraggedStage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef(null);

  // Debug logging utility
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  useEffect(() => {
    debugLog('App mounted');
    return () => debugLog('App unmounting');
  }, []);

  const refreshPersonaImage = () => {
    debugLog('Refreshing persona image');
    setPersona(prev => ({
      ...prev,
      imageTimestamp: Date.now()
    }));
  };

// A state for managing the alert
const [showExportAlert, setShowExportAlert] = useState(false);

// Export contents as Clipboard TSV
const handleExport = async () => {
  try {
    const success = await copyToClipboard(persona, stages, touchpoints);
    if (success) {
      setShowExportAlert(true);
    } else {
      throw new Error('Failed to copy to clipboard');
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to copy journey map data');
  }
};

  // Editable Field Component
  const EditableField = ({ value, onChange, placeholder, multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fieldValue, setFieldValue] = useState(value);
    const fieldId = useRef(`field-${Math.random().toString(36).slice(2)}`);

    useEffect(() => {
      setFieldValue(value);
    }, [value]);

    const handleBlur = () => {
      debugLog('Field blur', { id: fieldId.current, value: fieldValue });
      setIsEditing(false);
      onChange(fieldValue);
    };

    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            placeholder={placeholder}
            className="w-full bg-transparent border border-gray-300 rounded focus:outline-none focus:border-blue-500 p-2 h-24 resize-none"
          />
        );
      }
      return (
        <input
          type="text"
          value={fieldValue}
          onChange={e => setFieldValue(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 p-1"
        />
      );
    }

    return (
      <div
        onClick={() => {
          debugLog('Field click', { id: fieldId.current });
          setIsEditing(true);
        }}
        className={`w-full cursor-text p-1 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}
      >
        {value || placeholder}
      </div>
    );
  };
// Stage management
  const addStage = () => {
    debugLog('Adding new stage');
    const newStage = {
      id: Math.max(...stages.map(s => s.id), 0) + 1,
      title: 'Edit stage name',
      emotion: 'neutral',
      effort: 'moderate',
      objectives: '',
      thoughts: '',
      actions: '',
      frictionPoints: '',
      momentsOfTruth: '',
      opportunities: ''
    };
    setStages([...stages, newStage]);
  };

  const updateStageField = (stageId, field, value) => {
    debugLog('Updating stage field', { stageId, field, value });
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, [field]: value } : s
    ));
  };

  const removeStage = (stageId) => {
    debugLog('Removing stage', { stageId });
    setStages(stages.filter(s => s.id !== stageId));
    setTouchpoints(touchpoints.filter(t => t.stageId !== stageId));
  };

  // Drag and drop handlers
  const handleStageDragStart = (e, stage) => {
    debugLog('Stage drag start', { stageId: stage.id });
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStageDragEnd = () => {
    debugLog('Stage drag end');
    setDraggedStage(null);
  };

  const handleStageDragOver = (e, targetStage) => {
    e.preventDefault();
    if (!draggedStage || targetStage.id === draggedStage.id) return;

    debugLog('Stage drag over', { 
      draggedId: draggedStage.id, 
      targetId: targetStage.id 
    });

    const newStages = [...stages];
    const draggedIdx = stages.findIndex(s => s.id === draggedStage.id);
    const targetIdx = stages.findIndex(s => s.id === targetStage.id);
    
    newStages.splice(draggedIdx, 1);
    newStages.splice(targetIdx, 0, draggedStage);
    
    setStages(newStages);
  };

  // Touchpoint management
  const addTouchpoint = (stageId) => {
    debugLog('Adding touchpoint', { stageId });
    const newTouchpoint = {
      id: Math.random().toString(36).slice(2),
      content: 'Click to edit',
      stageId
    };
    setTouchpoints([...touchpoints, newTouchpoint]);
  };

  const updateTouchpointContent = (id, content) => {
    debugLog('Updating touchpoint', { id, content });
    setTouchpoints(touchpoints.map(t => 
      t.id === id ? { ...t, content } : t
    ));
  };

  const deleteTouchpoint = (id) => {
    debugLog('Deleting touchpoint', { id });
    setTouchpoints(touchpoints.filter(t => t.id !== id));
  };

  const handleTouchpointDragStart = (e, touchpoint) => {
    debugLog('Touchpoint drag start', { id: touchpoint.id });
    e.stopPropagation();
    e.dataTransfer.setData('touchpointId', touchpoint.id);
  };

  const handleTouchpointDrop = (e, stageId) => {
    e.preventDefault();
    const touchpointId = e.dataTransfer.getData('touchpointId');
    if (!touchpointId) return;

    debugLog('Touchpoint drop', { touchpointId, stageId });
    setTouchpoints(touchpoints.map(t => 
      t.id === touchpointId ? { ...t, stageId } : t
    ));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Linear Customer Journey Map</h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            📋 Copy to Clipboard
          </button>

        </div>
        {showExportAlert && (
          <Alert
            title="Journey Map Copied Successfully!"
            description="Your customer journey has been copied to the clipboard. Return to your spreadsheet and paste it in table 2.1"
            onClose={() => setShowExportAlert(false)}
          />
        )}

        <div className="mb-6">
          <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
            Welcome to the Customer Journey Map Canvas! Start by defining your user persona below. 
            Add journey stages using the 'Add Stage' button, and populate each stage with touchpoints, 
            emotions, and insights. Drag and drop stages to reorder them. Use the 'Capture Matrix' 
            button to save or share your complete journey map with persona details.
          </p>
        </div>
      </div>

      <div ref={captureRef} className="space-y-6">
        {/* Persona Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Persona</h2>
          <div className="flex gap-6">
            <div className="relative">
              <img
                src={`https://thispersondoesnotexist.com/?${persona.imageTimestamp}`}
                alt="AI Generated Persona"
                className="w-48 h-48 rounded-lg object-cover"
              />
              <button
                onClick={refreshPersonaImage}
                className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-grow space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Name</label>
                <EditableField
                  value={persona.name}
                  onChange={(value) => {
                    debugLog('Updating persona name', { value });
                    setPersona(prev => ({ ...prev, name: value }));
                  }}
                  placeholder="Enter persona name"
                />
              </div>
<div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Description</label>
                <EditableField
                  value={persona.description}
                  onChange={(value) => {
                    debugLog('Updating persona description', { value });
                    setPersona(prev => ({ ...prev, description: value }));
                  }}
                  placeholder="Enter persona description"
                  multiline
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stages Section */}
        <div className="flex gap-4 pb-6 overflow-x-auto capture-container">
          {stages.map(stage => (
            <div 
              key={stage.id}
              draggable
              onDragStart={(e) => handleStageDragStart(e, stage)}
              onDragOver={(e) => handleStageDragOver(e, stage)}
              onDragEnd={handleStageDragEnd}
              onDrop={(e) => handleTouchpointDrop(e, stage.id)}
              className="bg-white p-4 rounded-lg shadow-md min-w-96 max-w-96 flex-shrink-0 cursor-move space-y-4"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-5 h-5 text-gray-400" />
                <div className="flex-grow flex items-center gap-2 min-w-0">
                  <EditableField
                    value={stage.title}
                    onChange={(value) => updateStageField(stage.id, 'title', value)}
                    placeholder="Enter stage name"
                  />
                  <button
                    onClick={() => removeStage(stage.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 min-h-48 bg-gray-50 p-3 rounded-lg">
                  {touchpoints
                    .filter(t => t.stageId === stage.id)
                    .map(touchpoint => (
                      <div
                        key={touchpoint.id}
                        draggable
                        onDragStart={(e) => handleTouchpointDragStart(e, touchpoint)}
                        className="bg-yellow-50 p-3 rounded shadow-sm cursor-move relative group border border-yellow-200"
                      >
                        <EditableField
                          value={touchpoint.content}
                          onChange={(value) => updateTouchpointContent(touchpoint.id, value)}
                          placeholder="Enter touchpoint description"
                        />
                        <button
                          onClick={() => deleteTouchpoint(touchpoint.id)}
                          className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm p-1 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  
                  <button
                    onClick={() => addTouchpoint(stage.id)}
                    className="w-full flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Touchpoint
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Objectives</label>
                  <EditableField
                    value={stage.objectives}
                    onChange={(value) => updateStageField(stage.id, 'objectives', value)}
                    placeholder="What is the user trying to achieve?"
                    multiline
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Thoughts</label>
                  <EditableField
                    value={stage.thoughts}
                    onChange={(value) => updateStageField(stage.id, 'thoughts', value)}
                    placeholder="What is the user thinking?"
                    multiline
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Actions</label>
                  <EditableField
                    value={stage.actions}
                    onChange={(value) => updateStageField(stage.id, 'actions', value)}
                    placeholder="What actions is the user taking?"
                    multiline
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Emotion</label>
                    <select
                      value={stage.emotion}
                      onChange={(e) => updateStageField(stage.id, 'emotion', e.target.value)}
                      className="w-full p-2 border rounded-md bg-white"
                    >
                      {EMOTIONS.map(emotion => (
                        <option key={emotion.value} value={emotion.value}>
                          {emotion.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Effort</label>
                    <select
                      value={stage.effort}
                      onChange={(e) => updateStageField(stage.id, 'effort', e.target.value)}
                      className="w-full p-2 border rounded-md bg-white"
                    >
                      {EFFORT_LEVELS.map(effort => (
                        <option key={effort.value} value={effort.value}>
                          {effort.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Friction Points</label>
                  <EditableField
                    value={stage.frictionPoints}
                    onChange={(value) => updateStageField(stage.id, 'frictionPoints', value)}
                    placeholder="What problems or obstacles exist?"
                    multiline
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Moments of Truth</label>
                  <EditableField
                    value={stage.momentsOfTruth}
                    onChange={(value) => updateStageField(stage.id, 'momentsOfTruth', value)}
                    placeholder="What are the key moments that matter?"
                    multiline
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Opportunities</label>
                  <EditableField
                    value={stage.opportunities}
                    onChange={(value) => updateStageField(stage.id, 'opportunities', value)}
                    placeholder="What improvements could be made?"
                    multiline
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Stage Card */}
          <div className="min-w-96 max-w-96 flex-shrink-0 flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300">
            <button
              onClick={addStage}
              className="w-full flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors py-6"
            >
              <PlusCircle className="w-8 h-8" />
              <span className="font-medium">Add Stage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;