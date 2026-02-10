import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, List, ListItem, ListItemText,
  Chip, Alert, CircularProgress, Box, Typography,
  Fab, IconButton, Avatar, Fade, Grow, Paper,
  Tooltip, Divider, Badge, Backdrop,
} from '@mui/material';
import {
  Chat, Send, Close, SmartToy, Person, Delete,
  Refresh, ThumbUp, ThumbDown, Help, AutoAwesome,
  Pause, ArrowForward,
} from '@mui/icons-material';
import api from '../../utils/api';

const IndiaIsraelRecruitmentChatbot = ({ open, onClose, initialQuestion = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! 👋 I\'m your AI assistant for India-Israel recruitment. I can help you with:\n\nHow can I assist you today?',
      timestamp: new Date(),
      showQuickOptions: true, // Flag to show quick option buttons
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const messagesEndRef = useRef(null);
  const hasProcessedInitialQuestion = useRef(false);
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    const hasConsent = localStorage.getItem('chatbot_consent');
    if (hasConsent === 'true') {
      setConsentGiven(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const systemPrompts = [
    {
      id: 'visa-process',
      title: 'Visa Process',
      prompt: 'What is the visa process for working in Israel?',
      icon: '🛂',
      color: '#1976d2',
    },
    {
      id: 'skill-requirements',
      title: 'Skill Requirements',
      prompt: 'What skills are required for construction jobs in Israel?',
      icon: '🎓',
      color: '#2e7d32',
    },
    {
      id: 'employer-verification',
      title: 'Employer Verification',
      prompt: 'How do I verify an employer in Israel?',
      icon: '✅',
      color: '#ed6c02',
    },
    {
      id: 'salary-benefits',
      title: 'Salary & Benefits',
      prompt: 'What are the typical salary and benefits for workers in Israel?',
      icon: '💰',
      color: '#9c27b0',
    },
  ];

  const handleSendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || loading) return;

    if (!consentGiven) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      // Call backend API with RAG
      const response = await api.post('/chatbot/message', {
        message: messageText,
        sessionId: sessionId,
        userId: 'guest',
        metadata: { source: 'web_widget', url: window.location.href }
      });

      if (response.data.success) {
        const result = response.data.data;
        
        // Update session ID if provided
        if (result.sessionId && !sessionId) {
          setSessionId(result.sessionId);
        }

        // Update suggested actions
        if (result.suggestedActions) {
          setSuggestedActions(result.suggestedActions);
        }

        const botResponse = result.response;
        
        // Add bot message with typing effect
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          fullContent: botResponse,
          timestamp: new Date(),
          isTyping: true,
          sources: result.sources || [],
          confidence: result.confidence || 'medium',
          intent: result.intent || 'general',
        };

        setMessages(prev => [...prev, botMessage]);
        setTypingMessageIndex(botMessage.id);
        setIsTyping(true);
        
        // Simulate typing effect
        let index = 0;
        typingIntervalRef.current = setInterval(() => {
          if (index < botResponse.length) {
            setMessages(prev => prev.map(msg => 
              msg.id === botMessage.id 
                ? { ...msg, content: botResponse.substring(0, index + 1) }
                : msg
            ));
            index++;
            scrollToBottom();
          } else {
            clearInterval(typingIntervalRef.current);
            setMessages(prev => prev.map(msg => 
              msg.id === botMessage.id 
                ? { ...msg, content: botResponse, isTyping: false }
                : msg
            ));
            setIsTyping(false);
            setTypingMessageIndex(null);
            setLoading(false);
            setTyping(false);
          }
        }, 30);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('Chatbot API error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I encountered an error processing your request. Please try again or contact support at support@apravas.com',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      setTyping(false);
      setIsTyping(false);
    }
  };

  const pauseTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsTyping(false);
    setMessages(prev => prev.map(msg => 
      msg.isTyping ? { ...msg, isTyping: false } : msg
    ));
  };

  const handleSuggestedAction = async (action) => {
    const actionMessages = {
      'schedule_consultation': 'I want to schedule a consultation',
      'download_checklist': 'Can you send me the document checklist?',
      'check_eligibility': 'Check my eligibility',
      'fee_calculator': 'What are the total fees?',
      'speak_to_human': 'I want to speak with a human counselor',
      'contact_human': 'Connect me with Apravas support'
    };
   
    const message = actionMessages[action] || action;
    setInput(message);
    // Trigger send after a brief delay to allow input to update
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleConsent = () => {
    setConsentGiven(true);
    localStorage.setItem('chatbot_consent', 'true');
  };

  const handleQuickPrompt = async (prompt) => {
    // Remove quick options from initial message
    setMessages(prev => prev.map(msg => 
      msg.showQuickOptions ? { ...msg, showQuickOptions: false } : msg
    ));
    if (!consentGiven) {
      return;
    }

    setInput(prompt);
    // Use the same handleSendMessage function
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleClearChat = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: 'Chat cleared! How can I help you today?',
        timestamp: new Date(),
      }
    ]);
  };

  // Set fullscreen when chatbot opens
  useEffect(() => {
    if (open) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [open]);

  // Handle initial question when chatbot opens
  useEffect(() => {
    if (open && initialQuestion && consentGiven && !hasProcessedInitialQuestion.current) {
      hasProcessedInitialQuestion.current = true;
      const timer = setTimeout(() => {
        if (initialQuestion) {
          handleQuickPrompt(initialQuestion);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!open) {
      hasProcessedInitialQuestion.current = false;
    }
  }, [open, initialQuestion, consentGiven]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isLastBotMessage = (messageId) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'bot') {
        return messages[i].id === messageId;
      }
    }
    return false;
  };

  return (
    <>

      {/* Enhanced Chatbot Button */}
      {!open && (
        <Fade in>
          <Fab
            color="primary"
            aria-label="chat"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              background: '#7B0FFF',
              width: 48,
              height: 48,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'scale(1.1)',
                background: '#9000f6',
              },
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              const hasConsent = localStorage.getItem('chatbot_consent');
              if (hasConsent) {
                setConsentGiven(true);
              }
              setIsFullscreen(true);
              if (typeof onClose === 'function') {
                onClose(true);
              }
            }}
          >
            <Chat sx={{ fontSize: 23, color: 'white' }} />
          </Fab>
        </Fade>
      )}

      {/* Enhanced Chatbot Dialog - Fullscreen Style */}
      <Dialog
        open={open}
        onClose={() => {
          if (typeof onClose === 'function') {
            onClose(false);
          }
        }}
        maxWidth={false}
        fullWidth={false}
        disableEnforceFocus
        disableRestoreFocus
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: '1px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            maxWidth: '1200px',
            height: '80%',
            maxHeight: '80vh',
            borderRadius: '12px 12px 0 0',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
            '@media (max-width: 768px)': {
              width: '90%',
              height: '85%',
            },
            '@media (max-width: 575px)': {
              width: '100vw',
              height: '100vh',
              left: 0,
              transform: 'none',
              borderRadius: 0,
              top: 0,
              bottom: 0,
              maxHeight: '100vh',
            },
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(58, 58, 58, 0.6)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          },
        }}
      >
        {/* Header - Matching the provided design */}
        <Box
          sx={{
            background: '#fff',
            color: '#222',
            padding: '12px 20px',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            zIndex: 10,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(230, 216, 255, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SmartToy sx={{ fontSize: 20, color: '#7437d0' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#222',
                fontSize: '1.1rem',
              }}
            >
              ApravasGPT
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <IconButton
              onClick={handleClearChat}
              size="small"
              sx={{ color: '#333' }}
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
            <Box
              component="button"
              type="button"
              aria-label="Close chat"
              onClick={() => {
                if (typeof onClose === 'function') {
                  onClose(false);
                }
              }}
              sx={{
                cursor: 'pointer',
                padding: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: '#333',
                flexShrink: 0,
                minWidth: 44,
                minHeight: 44,
                borderRadius: '50%',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: '2px solid #7B0FFF', outlineOffset: 2 },
              }}
            >
              <Close sx={{ fontSize: 21 }} />
            </Box>
          </Box>
        </Box>

        {/* Helper Text */}
        <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: 'rgba(43, 42, 41, 1)',
              mb: 1,
            }}
          >
            How can{' '}
            <Box
              component="span"
              sx={{
                color: 'rgba(123, 15, 255, 1)',
                fontWeight: 600,
                position: 'relative',
                display: 'inline-block',
              }}
            >
              ApravasGPT
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: 0,
                  right: 0,
                  height: '14px',
                  background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 20\'%3E%3Cpath d=\'M0,10 Q25,5 50,10 T100,10\' stroke=\'%237B0FFF\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") no-repeat center',
                  backgroundSize: 'contain',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
            </Box>{' '}
            help?
          </Typography>
        </Box>

        <DialogContent
          dividers
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 0,
            background: 'linear-gradient(240deg, rgba(237, 246, 255, 1) 0%, rgba(252, 246, 255, 1) 20%, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 1) 60%, rgba(248, 242, 255, 1) 80%, rgba(237, 246, 255, 1) 100%)',
          }}
        >
          {!consentGiven && (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="info"
                icon={<Help />}
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                  GDPR Compliance Notice
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  By using this chatbot, you consent to the processing of your queries for recruitment assistance.
                  Your data will be handled in accordance with GDPR compliance standards.
                </Typography>
                <Button
                  onClick={handleConsent}
                  variant="contained"
                  size="small"
                  startIcon={<AutoAwesome />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                  }}
                >
                  I Consent - Continue
                </Button>
              </Alert>
            </Box>
          )}

          {/* Messages List - Matching the provided design */}
          <Box
            sx={{
              px: 2,
              py: 2,
              minHeight: '200px',
              maxHeight: 'calc(80vh - 250px)',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f0f0f0',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#7B0FFF',
                borderRadius: '10px',
                '&:hover': {
                  background: '#5e0cd2',
                },
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                {message.type === 'bot' && (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(230, 216, 255, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <SmartToy sx={{ fontSize: 20, color: '#7437d0' }} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius:
                        message.type === 'user'
                          ? '12px 12px 0 12px'
                          : '12px 12px 12px 0',
                      bgcolor:
                        message.type === 'user'
                          ? 'rgba(237, 225, 251, 1)'
                          : 'transparent',
                      color: 'rgba(43, 42, 41, 1)',
                      fontSize: '14px',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.6,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-line',
                        lineHeight: 1.6,
                        fontSize: '14px',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                          .replace(/\n/g, '<br>')
                          .replace(/• /g, '• '),
                      }}
                    />
                    {/* Source Citations */}
                    {message.sources && message.sources.length > 0 && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'rgba(123, 15, 255, 1)' }}>
                          Sources:
                        </Typography>
                        {message.sources.map((source, idx) => (
                          <Box key={idx} sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(114, 114, 113, 1)' }}>
                              {source.authority || 'Official Source'}
                              {source.country && ` (${source.country})`}
                              {source.url && (
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: 'rgba(123, 15, 255, 1)', 
                                    textDecoration: 'none',
                                    marginLeft: '4px'
                                  }}
                                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                >
                                  [View Source]
                                </a>
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    {/* Confidence Indicator */}
                    {message.confidence && message.type === 'bot' && (
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(114, 114, 113, 1)' }}>
                          Confidence: 
                        </Typography>
                        <Chip
                          label={message.confidence.toUpperCase()}
                          size="small"
                          sx={{
                            height: '16px',
                            fontSize: '9px',
                            bgcolor: message.confidence === 'high' ? 'rgba(76, 175, 80, 0.1)' : 
                                     message.confidence === 'medium' ? 'rgba(255, 152, 0, 0.1)' : 
                                     'rgba(244, 67, 54, 0.1)',
                            color: message.confidence === 'high' ? 'rgba(76, 175, 80, 1)' : 
                                   message.confidence === 'medium' ? 'rgba(255, 152, 0, 1)' : 
                                   'rgba(244, 67, 54, 1)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    )}
                    {/* Quick Option Buttons */}
                    {message.showQuickOptions && consentGiven && (
                      <Box sx={{ 
                        mt: 2, 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 1.5 
                      }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickPrompt('What is the visa process for working in Israel?')}
                          endIcon={<ArrowForward sx={{ fontSize: 16, transform: 'rotate(-45deg)' }} />}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            borderColor: 'rgba(123, 15, 255, 0.3)',
                            color: 'rgba(123, 15, 255, 1)',
                            fontWeight: 500,
                            py: 1.5,
                            px: 2,
                            borderRadius: '12px',
                            borderWidth: '1.5px',
                            '&:hover': {
                              borderColor: 'rgba(123, 15, 255, 0.6)',
                              bgcolor: 'rgba(123, 15, 255, 0.05)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Visa processes and requirements
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickPrompt('What skills are required for construction jobs in Israel?')}
                          endIcon={<ArrowForward sx={{ fontSize: 16, transform: 'rotate(-45deg)' }} />}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            borderColor: 'rgba(123, 15, 255, 0.3)',
                            color: 'rgba(123, 15, 255, 1)',
                            fontWeight: 500,
                            py: 1.5,
                            px: 2,
                            borderRadius: '12px',
                            borderWidth: '1.5px',
                            '&:hover': {
                              borderColor: 'rgba(123, 15, 255, 0.6)',
                              bgcolor: 'rgba(123, 15, 255, 0.05)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Skill requirements for jobs
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickPrompt('How do I verify an employer in Israel?')}
                          endIcon={<ArrowForward sx={{ fontSize: 16, transform: 'rotate(-45deg)' }} />}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            borderColor: 'rgba(123, 15, 255, 0.3)',
                            color: 'rgba(123, 15, 255, 1)',
                            fontWeight: 500,
                            py: 1.5,
                            px: 2,
                            borderRadius: '12px',
                            borderWidth: '1.5px',
                            '&:hover': {
                              borderColor: 'rgba(123, 15, 255, 0.6)',
                              bgcolor: 'rgba(123, 15, 255, 0.05)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Employer verification procedures
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickPrompt('What are the typical salary and benefits for workers in Israel?')}
                          endIcon={<ArrowForward sx={{ fontSize: 16, transform: 'rotate(-45deg)' }} />}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            borderColor: 'rgba(123, 15, 255, 0.3)',
                            color: 'rgba(123, 15, 255, 1)',
                            fontWeight: 500,
                            py: 1.5,
                            px: 2,
                            borderRadius: '12px',
                            borderWidth: '1.5px',
                            '&:hover': {
                              borderColor: 'rgba(123, 15, 255, 0.6)',
                              bgcolor: 'rgba(123, 15, 255, 0.05)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Salary and benefits information
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickPrompt('What are the recruitment procedures for working in Israel?')}
                          endIcon={<ArrowForward sx={{ fontSize: 16, transform: 'rotate(-45deg)' }} />}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            borderColor: 'rgba(123, 15, 255, 0.3)',
                            color: 'rgba(123, 15, 255, 1)',
                            fontWeight: 500,
                            py: 1.5,
                            px: 2,
                            borderRadius: '12px',
                            borderWidth: '1.5px',
                            gridColumn: { xs: '1', sm: 'span 2' },
                            '&:hover': {
                              borderColor: 'rgba(123, 15, 255, 0.6)',
                              bgcolor: 'rgba(123, 15, 255, 0.05)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Recruitment procedures
                        </Button>
                      </Box>
                    )}
                  </Paper>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5,
                      fontSize: '12px',
                      color: 'rgba(114, 114, 113, 1)',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {message.type === 'bot' && (
                      <>
                        <Typography variant="caption">ApravasGPT</Typography>
                        <Typography variant="caption">•</Typography>
                      </>
                    )}
                    <Typography variant="caption">
                      {formatTime(message.timestamp)}
                    </Typography>
                    {message.type === 'bot' &&
                      isTyping &&
                      isLastBotMessage(message.id) && (
                        <IconButton
                          onClick={pauseTyping}
                          size="small"
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: 'rgba(230, 216, 255, 1)',
                            color: '#7437d0',
                            '&:hover': {
                              bgcolor: '#d1bfff',
                            },
                          }}
                        >
                          <Pause sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                  </Box>
                </Box>
                {message.type === 'user' && (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(237, 225, 251, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Person sx={{ fontSize: 20, color: '#7437d0' }} />
                  </Box>
                )}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </DialogContent>

        {/* Suggested Actions */}
        {suggestedActions.length > 0 && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'white',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              flexWrap: 'wrap',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f0f0f0',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#7B0FFF',
                borderRadius: '10px',
              },
            }}
          >
            {suggestedActions.map((action, idx) => (
              <Chip
                key={idx}
                label={action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                onClick={() => handleSuggestedAction(action)}
                sx={{
                  bgcolor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '12px',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#7B0FFF',
                    color: 'white',
                    borderColor: '#7B0FFF',
                  },
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        )}

        {/* Input Area - Matching the provided design */}
        <Box
          sx={{
            p: '10px',
            bgcolor: 'white',
            borderTop: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            position: 'absolute',
            bottom: '5px',
            width: '70%',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            borderRadius: '12px 12px 0 0',
            '@media (max-width: 575px)': {
              width: '100%',
              left: 0,
              transform: 'none',
              position: 'relative',
              bottom: 'auto',
            },
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!consentGiven || loading || isTyping}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: 'transparent',
                fontSize: '14px',
                '& fieldset': {
                  border: 'none',
                },
                '& textarea': {
                  resize: 'none',
                  height: '50px !important',
                },
              },
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || !consentGiven || loading || isTyping}
            sx={{
              minWidth: 'auto',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              bgcolor: '#7B0FFF',
              color: 'white',
              fontSize: '20px',
              '&:hover': {
                bgcolor: '#9000f6',
              },
              '&:disabled': {
                bgcolor: '#bdbdbd',
                color: '#f0f0f0',
              },
              transition: 'all 0.2s ease',
            }}
          >
            ➤
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default IndiaIsraelRecruitmentChatbot;
