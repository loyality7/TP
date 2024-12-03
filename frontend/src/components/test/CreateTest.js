import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Switch, 
  FormControlLabel, 
  Button,
  MenuItem,
  Grid,
  Paper,
  Alert,
  Select,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../../services/api';

const CreateTest = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Remove all defaults - everything starts empty
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: '',
    proctoring: '', // Changed from false to empty string
    instructions: '',
    type: '',
    category: '',
    difficulty: '',
    accessControl: {
      type: '',
      userLimit: ''
    },
    mcqs: [], // Empty array - no default MCQs
    codingChallenges: [] // Empty array - no default challenges
  });

  const validateMCQ = (mcq, index) => {
    const requiredMCQFields = {
      question: 'Question',
      options: 'Options',
      correctOptions: 'Correct Options',
      answerType: 'Answer Type',
      marks: 'Marks',
      difficulty: 'Difficulty'
    };

    // Basic field validation
    for (const [field, label] of Object.entries(requiredMCQFields)) {
      if (!mcq[field] || (Array.isArray(mcq[field]) && mcq[field].length === 0)) {
        return `MCQ ${index + 1}: ${label} is required`;
      }
    }

    // Options validation
    if (mcq.options.length < 2) {
      return `MCQ ${index + 1}: Must have at least 2 options`;
    }

    if (mcq.options.some(opt => !opt.trim())) {
      return `MCQ ${index + 1}: Options cannot be empty`;
    }

    // Answer type specific validation
    if (mcq.answerType === 'single') {
      // For single answer type, correctOptions must be a single number
      if (typeof mcq.correctOptions !== 'number') {
        return `MCQ ${index + 1}: Single answer questions must have exactly one correct option`;
      }
      if (mcq.correctOptions >= mcq.options.length) {
        return `MCQ ${index + 1}: Correct option index is out of range`;
      }
    } else if (mcq.answerType === 'multiple') {
      // For multiple answer type, correctOptions must be an array
      if (!Array.isArray(mcq.correctOptions) || mcq.correctOptions.length === 0) {
        return `MCQ ${index + 1}: Multiple answer questions must have at least one correct option`;
      }
      if (mcq.correctOptions.some(opt => opt >= mcq.options.length)) {
        return `MCQ ${index + 1}: Some correct option indices are out of range`;
      }
    }

    return null;
  };

  const validateCodingChallenge = (challenge) => {
    const requiredFields = {
      title: 'Title',
      description: 'Description',
      constraints: 'Constraints',
      allowedLanguages: 'Allowed Languages',
      marks: 'Marks',
      timeLimit: 'Time Limit',
      memoryLimit: 'Memory Limit',
      difficulty: 'Difficulty'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!challenge[field] || (Array.isArray(challenge[field]) && challenge[field].length === 0)) {
        return `Coding Challenge ${label} is required`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate MCQs
      for (let i = 0; i < testData.mcqs.length; i++) {
        const mcqError = validateMCQ(testData.mcqs[i], i);
        if (mcqError) {
          throw new Error(mcqError);
        }
      }

      // Validate Coding Challenges
      for (let i = 0; i < testData.codingChallenges.length; i++) {
        const challengeError = validateCodingChallenge(testData.codingChallenges[i]);
        if (challengeError) {
          throw new Error(challengeError);
        }
      }
      
      // Clean and prepare data
      const preparedData = {
        ...testData,
        mcqs: testData.mcqs.map(mcq => ({
          ...mcq,
          marks: Number(mcq.marks),
          options: mcq.options.filter(opt => opt.trim()),
          correctOptions: mcq.answerType === 'single' 
            ? [Number(mcq.correctOptions)]
            : Array.isArray(mcq.correctOptions) 
              ? mcq.correctOptions.map(Number) 
              : [Number(mcq.correctOptions)]
        })),
        codingChallenges: testData.codingChallenges.map(challenge => ({
          ...challenge,
          marks: Number(challenge.marks),
          timeLimit: Number(challenge.timeLimit),
          memoryLimit: Number(challenge.memoryLimit),
          problemStatement: challenge.description,
          language: challenge.allowedLanguages[0] || 'javascript',
          testCases: challenge.testCases?.map(testCase => ({
            ...testCase,
            hidden: testCase.hidden || false
          })) || [],
          allowedLanguages: challenge.allowedLanguages || ['javascript']
        })),
        duration: Number(testData.duration),
        accessControl: {
          type: testData.accessControl.type,
          userLimit: testData.accessControl.userLimit 
            ? Number(testData.accessControl.userLimit) 
            : null
        }
      };

      // Validate coding challenges
      preparedData.codingChallenges.forEach((challenge, index) => {
        const requiredFields = {
          title: 'Title',
          description: 'Description',
          constraints: 'Constraints',
          language: 'Language',
          allowedLanguages: 'Allowed Languages',
          marks: 'Marks',
          timeLimit: 'Time Limit',
          memoryLimit: 'Memory Limit',
          difficulty: 'Difficulty'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
          if (!challenge[field] || 
              (Array.isArray(challenge[field]) && challenge[field].length === 0)) {
            throw new Error(`Coding Challenge ${index + 1}: ${label} is required`);
          }
        }

        // Validate test cases if present
        if (challenge.testCases?.length > 0) {
          challenge.testCases.forEach((testCase, testIndex) => {
            if (!testCase.input || !testCase.output) {
              throw new Error(
                `Coding Challenge ${index + 1}, Test Case ${testIndex + 1}: Input and Output are required`
              );
            }
          });
        }
      });

      console.log('Sending request to server with prepared data:', preparedData);
      const response = await apiService.post('/tests', preparedData);
      console.log('Server response:', response);
      setSuccess('Test created successfully!');
      navigate(`/tests/${response._id}`);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || 'Error creating test. Please check your input and try again.');
    }
  };

  const handleLanguageImplementationChange = (index, language, field, value) => {
    const newChallenges = [...testData.codingChallenges];
    if (!newChallenges[index].languageImplementations) {
      newChallenges[index].languageImplementations = {};
    }
    if (!newChallenges[index].languageImplementations[language]) {
      newChallenges[index].languageImplementations[language] = { visibleCode: '', invisibleCode: '' };
    }
    newChallenges[index].languageImplementations[language][field] = value;
    setTestData({ ...testData, codingChallenges: newChallenges });
  };

  return (
    <Layout>
      <Box component="form" onSubmit={handleSubmit} p={3}>
        <Typography variant="h4" gutterBottom>
          Create Test
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* Basic Test Information */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              
              <FormControl fullWidth margin="normal" required>
                <TextField
                  label="Title"
                  value={testData.title}
                  onChange={(e) => setTestData({...testData, title: e.target.value})}
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <TextField
                  label="Description"
                  value={testData.description}
                  onChange={(e) => setTestData({...testData, description: e.target.value})}
                  multiline
                  rows={4}
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={testData.type}
                  onChange={(e) => setTestData({...testData, type: e.target.value})}
                  required
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="assessment">Assessment</MenuItem>
                  <MenuItem value="practice">Practice</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <TextField
                  type="number"
                  label="Duration (minutes)"
                  value={testData.duration}
                  onChange={(e) => setTestData({...testData, duration: e.target.value})}
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={testData.difficulty}
                  onChange={(e) => setTestData({...testData, difficulty: e.target.value})}
                  required
                >
                  <MenuItem value="">Select Difficulty</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <TextField
                  label="Category"
                  value={testData.category}
                  onChange={(e) => setTestData({...testData, category: e.target.value})}
                  required
                  helperText="e.g., web-development, algorithms, databases"
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Instructions"
                  value={testData.instructions}
                  onChange={(e) => setTestData({...testData, instructions: e.target.value})}
                  multiline
                  rows={4}
                />
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Proctoring</InputLabel>
                <Select
                  value={testData.proctoring}
                  onChange={(e) => setTestData({...testData, proctoring: e.target.value})}
                  required
                >
                  <MenuItem value="">Select Proctoring Option</MenuItem>
                  <MenuItem value={true}>Enable</MenuItem>
                  <MenuItem value={false}>Disable</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Access Control */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Access Control</Typography>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Access Type</InputLabel>
                <Select
                  value={testData.accessControl.type}
                  onChange={(e) => setTestData({
                    ...testData,
                    accessControl: {...testData.accessControl, type: e.target.value}
                  })}
                  required
                >
                  <MenuItem value="">Select Access Type</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>

              {testData.accessControl.type === 'private' && (
                <FormControl fullWidth margin="normal">
                  <TextField
                    type="number"
                    label="User Limit"
                    value={testData.accessControl.userLimit}
                    onChange={(e) => setTestData({
                      ...testData,
                      accessControl: {...testData.accessControl, userLimit: e.target.value}
                    })}
                    helperText="Leave empty for unlimited users"
                  />
                </FormControl>
              )}
            </Paper>
          </Grid>

          {/* MCQs Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Multiple Choice Questions
              </Typography>

              {testData.mcqs.map((mcq, index) => (
                <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Question {index + 1}
                        <IconButton 
                          size="small" 
                          sx={{ ml: 1 }}
                          onClick={() => {
                            const newMcqs = testData.mcqs.filter((_, i) => i !== index);
                            setTestData({ ...testData, mcqs: newMcqs });
                          }}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Question"
                        value={mcq.question}
                        onChange={(e) => {
                          const newMcqs = [...testData.mcqs];
                          newMcqs[index].question = e.target.value;
                          setTestData({ ...testData, mcqs: newMcqs });
                        }}
                      />
                    </Grid>

                    {/* Options */}
                    <Grid item xs={12}>
                      {mcq.options.map((option, optIndex) => (
                        <Box key={optIndex} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            required
                            label={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newMcqs = [...testData.mcqs];
                              newMcqs[index].options[optIndex] = e.target.value;
                              setTestData({ ...testData, mcqs: newMcqs });
                            }}
                          />
                          <IconButton
                            onClick={() => {
                              const newMcqs = [...testData.mcqs];
                              newMcqs[index].options = mcq.options.filter((_, i) => i !== optIndex);
                              setTestData({ ...testData, mcqs: newMcqs });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const newMcqs = [...testData.mcqs];
                          newMcqs[index].options.push('');
                          setTestData({ ...testData, mcqs: newMcqs });
                        }}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Grid>

                    {/* Correct Options */}
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Correct Option(s)</InputLabel>
                        <Select
                          multiple={mcq.answerType === 'multiple'}
                          value={mcq.answerType === 'single' 
                            ? [mcq.correctOptions] // Wrap single value in array
                            : (Array.isArray(mcq.correctOptions) ? mcq.correctOptions : [])}
                          onChange={(e) => {
                            const newMcqs = [...testData.mcqs];
                            if (mcq.answerType === 'single') {
                              // For single answer, store the first selected value in an array
                              const selectedValue = Array.isArray(e.target.value) 
                                ? e.target.value[0] 
                                : e.target.value;
                              newMcqs[index].correctOptions = selectedValue;
                            } else {
                              // For multiple answers, store array directly
                              newMcqs[index].correctOptions = e.target.value;
                            }
                            setTestData({ ...testData, mcqs: newMcqs });
                          }}
                        >
                          {mcq.options.map((_, optIndex) => (
                            <MenuItem key={optIndex} value={optIndex}>
                              Option {optIndex + 1}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Answer Type</InputLabel>
                        <Select
                          value={mcq.answerType}
                          onChange={(e) => {
                            const newMcqs = [...testData.mcqs];
                            newMcqs[index].answerType = e.target.value;
                            newMcqs[index].correctOptions = []; // Reset correct options when type changes
                            setTestData({ ...testData, mcqs: newMcqs });
                          }}
                        >
                          <MenuItem value="">Select Type</MenuItem>
                          <MenuItem value="single">Single Answer</MenuItem>
                          <MenuItem value="multiple">Multiple Answers</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Marks"
                        value={mcq.marks}
                        onChange={(e) => {
                          const newMcqs = [...testData.mcqs];
                          newMcqs[index].marks = e.target.value;
                          setTestData({ ...testData, mcqs: newMcqs });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                          value={mcq.difficulty}
                          onChange={(e) => {
                            const newMcqs = [...testData.mcqs];
                            newMcqs[index].difficulty = e.target.value;
                            setTestData({ ...testData, mcqs: newMcqs });
                          }}
                        >
                          <MenuItem value="">Select Difficulty</MenuItem>
                          <MenuItem value="easy">Easy</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Explanation"
                        multiline
                        rows={2}
                        value={mcq.explanation}
                        onChange={(e) => {
                          const newMcqs = [...testData.mcqs];
                          newMcqs[index].explanation = e.target.value;
                          setTestData({ ...testData, mcqs: newMcqs });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={() => {
                  setTestData({
                    ...testData,
                    mcqs: [...testData.mcqs, {
                      question: '',
                      options: ['', ''],
                      correctOptions: '', // Empty string for initial state
                      answerType: 'single', // Default to single
                      marks: '',
                      difficulty: '',
                      explanation: ''
                    }]
                  });
                }}
                sx={{ mt: 2 }}
              >
                Add MCQ
              </Button>
            </Paper>
          </Grid>

          {/* Coding Challenges Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Coding Challenges
              </Typography>

              {testData.codingChallenges.map((challenge, index) => (
                <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Challenge {index + 1}
                        <IconButton 
                          size="small" 
                          sx={{ ml: 1 }}
                          onClick={() => {
                            const newChallenges = testData.codingChallenges.filter((_, i) => i !== index);
                            setTestData({ ...testData, codingChallenges: newChallenges });
                          }}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Title"
                        value={challenge.title}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].title = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Description"
                        value={challenge.description}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].description = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={2}
                        label="Constraints"
                        value={challenge.constraints}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].constraints = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Allowed Languages</InputLabel>
                        <Select
                          multiple
                          value={challenge.allowedLanguages || []}
                          onChange={(e) => {
                            const newChallenges = [...testData.codingChallenges];
                            newChallenges[index].allowedLanguages = e.target.value;
                            setTestData({ ...testData, codingChallenges: newChallenges });
                          }}
                        >
                          <MenuItem value="javascript">JavaScript</MenuItem>
                          <MenuItem value="python">Python</MenuItem>
                          <MenuItem value="java">Java</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Marks"
                        value={challenge.marks}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].marks = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Time Limit (seconds)"
                        value={challenge.timeLimit}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].timeLimit = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Memory Limit (MB)"
                        value={challenge.memoryLimit}
                        onChange={(e) => {
                          const newChallenges = [...testData.codingChallenges];
                          newChallenges[index].memoryLimit = e.target.value;
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                          value={challenge.difficulty}
                          onChange={(e) => {
                            const newChallenges = [...testData.codingChallenges];
                            newChallenges[index].difficulty = e.target.value;
                            setTestData({ ...testData, codingChallenges: newChallenges });
                          }}
                        >
                          <MenuItem value="">Select Difficulty</MenuItem>
                          <MenuItem value="easy">Easy</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Language Implementations */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Language Implementations</Typography>
                      {challenge.allowedLanguages.map((language) => (
                        <Box key={language} sx={{ mb: 2 }}>
                          <Typography variant="body1" gutterBottom>{language}</Typography>
                          <TextField
                            fullWidth
                            label="Visible Code"
                            multiline
                            rows={4}
                            value={challenge.languageImplementations?.[language]?.visibleCode || ''}
                            onChange={(e) => handleLanguageImplementationChange(index, language, 'visibleCode', e.target.value)}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            fullWidth
                            label="Invisible Code"
                            multiline
                            rows={4}
                            value={challenge.languageImplementations?.[language]?.invisibleCode || ''}
                            onChange={(e) => handleLanguageImplementationChange(index, language, 'invisibleCode', e.target.value)}
                          />
                        </Box>
                      ))}
                    </Grid>

                    {/* Test Cases */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Test Cases</Typography>
                      {(challenge.testCases || []).map((testCase, testIndex) => (
                        <Box key={testIndex} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                required
                                label="Input"
                                value={testCase.input}
                                onChange={(e) => {
                                  const newChallenges = [...testData.codingChallenges];
                                  newChallenges[index].testCases[testIndex].input = e.target.value;
                                  setTestData({ ...testData, codingChallenges: newChallenges });
                                }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                required
                                label="Output"
                                value={testCase.output}
                                onChange={(e) => {
                                  const newChallenges = [...testData.codingChallenges];
                                  newChallenges[index].testCases[testIndex].output = e.target.value;
                                  setTestData({ ...testData, codingChallenges: newChallenges });
                                }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={testCase.hidden || false}
                                    onChange={(e) => {
                                      const newChallenges = [...testData.codingChallenges];
                                      newChallenges[index].testCases[testIndex].hidden = e.target.checked;
                                      setTestData({ ...testData, codingChallenges: newChallenges });
                                    }}
                                  />
                                }
                                label="Hidden Test Case"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Explanation"
                                value={testCase.explanation || ''}
                                onChange={(e) => {
                                  const newChallenges = [...testData.codingChallenges];
                                  newChallenges[index].testCases[testIndex].explanation = e.target.value;
                                  setTestData({ ...testData, codingChallenges: newChallenges });
                                }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                color="error"
                                onClick={() => {
                                  const newChallenges = [...testData.codingChallenges];
                                  newChallenges[index].testCases = challenge.testCases.filter((_, i) => i !== testIndex);
                                  setTestData({ ...testData, codingChallenges: newChallenges });
                                }}
                              >
                                Remove Test Case
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const newChallenges = [...testData.codingChallenges];
                          if (!newChallenges[index].testCases) {
                            newChallenges[index].testCases = [];
                          }
                          newChallenges[index].testCases.push({
                            input: '',
                            output: '',
                            hidden: false,
                            explanation: ''
                          });
                          setTestData({ ...testData, codingChallenges: newChallenges });
                        }}
                      >
                        Add Test Case
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={() => {
                  setTestData({
                    ...testData,
                    codingChallenges: [...testData.codingChallenges, {
                      title: '',
                      description: '',
                      constraints: '',
                      allowedLanguages: [],
                      marks: '',
                      timeLimit: '',
                      memoryLimit: '',
                      difficulty: '',
                      testCases: []
                    }]
                  });
                }}
                sx={{ mt: 2 }}
              >
                Add Coding Challenge
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              fullWidth
            >
              Create Test
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default CreateTest;
