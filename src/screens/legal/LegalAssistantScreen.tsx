import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AILegalAssistant, LegalQuestion, LegalResponse, LegalCase } from '../../services/legal/AILegalAssistant';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  isTyping?: boolean;
  response?: LegalResponse;
}

interface QuickQuestion {
  id: string;
  text: string;
  icon: string;
  category: 'case_strategy' | 'document_help' | 'legal_rights' | 'next_steps' | 'settlement' | 'deadline';
}

const LegalAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [currentCase, setCurrentCase] = useState<LegalCase | null>(null);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [userCases, setUserCases] = useState<LegalCase[]>([]);

  const flatListRef = useRef<FlatList>(null);
  const legalAssistantRef = useRef<AILegalAssistant>(new AILegalAssistant());

  const quickQuestions: QuickQuestion[] = [
    {
      id: 'q1',
      text: 'What should I do after receiving a collection call?',
      icon: 'phone',
      category: 'legal_rights'
    },
    {
      id: 'q2',
      text: 'How do I validate a debt?',
      icon: 'description',
      category: 'document_help'
    },
    {
      id: 'q3',
      text: 'What violations might apply to my case?',
      icon: 'gavel',
      category: 'case_strategy'
    },
    {
      id: 'q4',
      text: 'What\'s my next legal step?',
      icon: 'trending-up',
      category: 'next_steps'
    },
    {
      id: 'q5',
      text: 'How much should I settle for?',
      icon: 'attach-money',
      category: 'settlement'
    },
    {
      id: 'q6',
      text: 'What are my legal deadlines?',
      icon: 'schedule',
      category: 'deadline'
    }
  ];

  useEffect(() => {
    loadUserCases();
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: "Hello! I'm your AI Legal Assistant. I can help you understand your rights, analyze your case, recommend legal strategies, and guide you through the consumer protection process.\n\nHow can I assist you today?",
      sender: 'assistant',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const loadUserCases = async () => {
    try {
      // Mock user ID - in real app, get from auth
      const userId = 'user_123';
      const cases = await legalAssistantRef.current.getUserCases(userId);
      setUserCases(cases);
      if (cases.length > 0) {
        setCurrentCase(cases[0]);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    }
  };

  const sendMessage = async (text: string, category?: string) => {
    if (!text.trim() || isLoading) return;

    // Hide quick questions after first message
    setShowQuickQuestions(false);

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      text: '',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const legalQuestion: LegalQuestion = {
        id: `q_${Date.now()}`,
        userId: 'user_123', // Mock user ID
        caseId: currentCase?.id,
        question: text.trim(),
        category: category as any || 'legal_rights',
        priority: 'medium',
        timestamp: new Date().toISOString(),
        resolved: false
      };

      const response = await legalAssistantRef.current.answerLegalQuestion(legalQuestion);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));

      const assistantMessage: Message = {
        id: `resp_${Date.now()}`,
        text: response.answer,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        response
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Failed to get legal response:', error);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: QuickQuestion) => {
    sendMessage(question.text, question.category);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    if (item.isTyping) {
      return (
        <View style={[styles.messageContainer, styles.typingContainer]}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.typingText}>Legal Assistant is thinking...</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {item.text}
          </Text>

          {item.response && (
            <View style={styles.responseDetails}>
              {item.response.sources.length > 0 && (
                <View style={styles.sourcesSection}>
                  <Text style={styles.sourcesTitle}>Legal Sources:</Text>
                  {item.response.sources.map((source, index) => (
                    <View key={index} style={styles.sourceItem}>
                      <Icon name="library-books" size={14} color="#666" />
                      <Text style={styles.sourceText}>
                        {source.title} - {source.citation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {item.response.actionItems.length > 0 && (
                <View style={styles.actionItemsSection}>
                  <Text style={styles.actionItemsTitle}>Recommended Actions:</Text>
                  {item.response.actionItems.map((action, index) => (
                    <View key={index} style={styles.actionItem}>
                      <Icon name="check-circle" size={14} color="#4CAF50" />
                      <Text style={styles.actionItemText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.confidenceSection}>
                <Text style={styles.confidenceText}>
                  Confidence: {item.response.confidence}%
                </Text>
                {item.response.attorneyReview && (
                  <Text style={styles.attorneyReviewText}>
                    Attorney Review Recommended
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  const renderQuickQuestions = () => {
    if (!showQuickQuestions) return null;

    return (
      <View style={styles.quickQuestionsContainer}>
        <Text style={styles.quickQuestionsTitle}>Common Questions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickQuestions.map(question => (
            <TouchableOpacity
              key={question.id}
              style={styles.quickQuestionCard}
              onPress={() => handleQuickQuestion(question)}
            >
              <Icon
                name={question.icon}
                size={24}
                color="#007AFF"
                style={styles.quickQuestionIcon}
              />
              <Text style={styles.quickQuestionText}>{question.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCaseSelector = () => {
    return (
      <Modal
        visible={showCaseSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCaseSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Case</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCaseSelector(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.casesList}>
              {userCases.map(case_ => (
                <TouchableOpacity
                  key={case_.id}
                  style={[
                    styles.caseItem,
                    currentCase?.id === case_.id && styles.selectedCaseItem
                  ]}
                  onPress={() => {
                    setCurrentCase(case_);
                    setShowCaseSelector(false);
                  }}
                >
                  <View style={styles.caseItemContent}>
                    <Text style={styles.caseTitle}>{case_.title}</Text>
                    <Text style={styles.caseType}>{case_.caseType.replace('_', ' ')}</Text>
                    <Text style={styles.caseStatus}>{case_.status}</Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color="#ccc"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.newCaseButton}
              onPress={() => {
                // Navigate to new case creation
                setShowCaseSelector(false);
              }}
            >
              <Icon name="add" size={20} color="#007AFF" />
              <Text style={styles.newCaseButtonText}>Start New Case Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>AI Legal Assistant</Text>

          <TouchableOpacity
            style={styles.caseSelectorButton}
            onPress={() => setShowCaseSelector(true)}
          >
            <Icon name="folder" size={24} color="#007AFF" />
            {currentCase && (
              <View style={styles.caseIndicator} />
            )}
          </TouchableOpacity>
        </View>

        {currentCase && (
          <View style={styles.currentCaseBar}>
            <Text style={styles.currentCaseText}>
              Current Case: {currentCase.title}
            </Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Quick Questions */}
        {renderQuickQuestions()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your legal question..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Icon
              name="send"
              size={20}
              color={(inputText.trim() && !isLoading) ? '#fff' : '#ccc'}
            />
          </TouchableOpacity>
        </View>

        {/* Case Selector Modal */}
        {renderCaseSelector()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  caseSelectorButton: {
    padding: 8,
    position: 'relative',
  },
  caseIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  currentCaseBar: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  currentCaseText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  responseDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sourcesSection: {
    marginBottom: 12,
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  actionItemsSection: {
    marginBottom: 12,
  },
  actionItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionItemText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  confidenceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  attorneyReviewText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  quickQuestionsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickQuestionCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 200,
  },
  quickQuestionIcon: {
    marginBottom: 8,
    alignSelf: 'center',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  casesList: {
    maxHeight: 300,
  },
  caseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCaseItem: {
    backgroundColor: '#E3F2FD',
  },
  caseItemContent: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  caseType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  caseStatus: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  newCaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  newCaseButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default LegalAssistantScreen;