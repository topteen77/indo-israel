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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const botResponse = generateBotResponse(messageText);
      
      // Add bot message with typing effect
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '',
        fullContent: botResponse,
        timestamp: new Date(),
        isTyping: true,
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

    } catch (error) {
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

  const generateBotResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('visa') || lowerQuery.includes('work permit')) {
      return `🛂 **Visa Process for Working in Israel**

Here's a step-by-step guide:

**1. Job Offer** 📝
   - Secure a job offer from an Israeli employer
   - Ensure the employer is PIBA verified

**2. Work Permit Application** 📋
   - Your employer applies through PIBA (Population and Immigration Authority)
   - Processing time: 30-45 days

**3. Medical Examination** 🏥
   - Complete medical fitness certificate
   - Must be from authorized medical center

**4. Documentation** 📄
   - Valid passport (minimum 2 years validity)
   - Educational certificates
   - Experience certificates
   - Police clearance certificate

**5. Visa Processing** ⏳
   - PIBA reviews your application
   - Background checks are conducted

**6. Final Approval** ✅
   - Receive work visa
   - Travel arrangements can be made

⚠️ **Important**: This is guidance only. Consult NSDC India or PIBA Israel for official procedures.

**Contact:**
- NSDC India: +91-11-4747-4700
- PIBA Israel: +972-2-629-4666`;
    }
    
    if (lowerQuery.includes('skill') || lowerQuery.includes('requirement')) {
      return `🎓 **Skill Requirements by Job Category**

**🏗️ Construction Jobs:**
   ✓ Minimum 2-3 years experience
   ✓ Safety certifications
   ✓ Physical fitness certificate
   ✓ Basic English/Hebrew communication

**🏥 Healthcare Jobs:**
   ✓ Nursing or healthcare certifications
   ✓ Relevant work experience
   ✓ Medical license (if applicable)
   ✓ Language proficiency

**🌾 Agriculture Jobs:**
   ✓ Experience in farming/agriculture
   ✓ Physical fitness
   ✓ Willingness to work in rural areas

**💻 IT Jobs:**
   ✓ Technical certifications
   ✓ Programming skills
   ✓ Relevant degree/experience
   ✓ English proficiency

For specific requirements, check job postings or contact NSDC International.`;
    }
    
    if (lowerQuery.includes('employer') || lowerQuery.includes('verify')) {
      return `✅ **Employer Verification Guide**

**How to Verify:**
1. **Company Registration** - Check Israeli Companies Authority
2. **PIBA Authorization** - Verify employer can hire foreign workers
3. **License Check** - Confirm valid labor license
4. **NSDC Verification** - Contact NSDC India for assistance

**🚨 Red Flags to Watch:**
   ⚠️ Requests for upfront payment
   ⚠️ Unclear job descriptions
   ⚠️ Pressure to sign quickly
   ⚠️ Unverified contact information

**Always verify through official channels before accepting any job offer.**

**Verification Assistance:**
- NSDC India: info@nsdcindia.org
- PIBA Israel: piba@piba.gov.il`;
    }
    
    if (lowerQuery.includes('salary') || lowerQuery.includes('benefit') || lowerQuery.includes('wage')) {
      return `💰 **Salary & Benefits in Israel**

**🏗️ Construction Workers:**
   💵 Monthly: ₹80,000 - ₹1,20,000
   🏠 Accommodation: Usually provided
   🏥 Health Insurance: Mandatory
   ⏰ Hours: 8-10 hours/day, 6 days/week

**🏥 Healthcare Workers:**
   💵 Monthly: ₹1,00,000 - ₹1,50,000
   📚 Professional development
   🏥 Health insurance
   🏖️ Paid leave

**📦 General Benefits:**
   ✓ Accommodation (often provided)
   ✓ Health insurance coverage
   ✓ Return ticket (after contract)
   ✓ Legal protection under Israeli labor laws

⚠️ **Note**: Salaries vary by experience, skills, and employer. Always confirm in your employment contract.

For specific information, contact NSDC International.`;
    }
    
    // Default response
    return `🤖 I can help you with information about:

📋 **Topics I can assist with:**
   • Visa processes and work permits
   • Skill requirements for different jobs
   • Employer verification
   • Salary and benefits
   • Recruitment procedures
   • Required documents
   • NSDC and PIBA guidelines

💡 **Tip**: Ask a specific question or use the quick prompts below for faster answers.

⚠️ **For official legal advice**, please consult with NSDC India or PIBA Israel directly.

**📞 Official Contacts:**
- NSDC India: +91-11-4747-4700, info@nsdcindia.org
- PIBA Israel: +972-2-629-4666, piba@piba.gov.il`;
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

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const botResponse = generateBotResponse(prompt);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '',
        fullContent: botResponse,
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, botMessage]);
      setTypingMessageIndex(botMessage.id);
      setIsTyping(true);
      
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

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I encountered an error processing your request. Please try again or contact support.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      setTyping(false);
      setIsTyping(false);
    }
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
            margin: '0 7%',
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
