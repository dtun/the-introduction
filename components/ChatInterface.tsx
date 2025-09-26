import MessageBubble from "@/components/MessageBubble";
import { Text, View } from "@/components/Themed";
import { UserProfile } from "@/schemas/userProfile";
import { AIService } from "@/services/AIService";
import { Message } from "@/types/chat";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm here to help you create your profile. Let's start with a simple question - what's your name?",
      timestamp: new Date(),
      sender: "system",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [extractedProfile, setExtractedProfile] = useState<
    Partial<UserProfile>
  >({});

  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || isProcessing) return;

    const userMessage: Message = {
      id: generateId(),
      text: inputText.trim(),
      timestamp: new Date(),
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);

    try {
      // Use AIService to process the message
      const aiResponse = await AIService.processMessage(
        userMessage.text,
        extractedProfile,
        [...messages, userMessage]
      );

      // Update extracted profile with new data
      setExtractedProfile(aiResponse.extractedData);

      // Check if profile is complete
      if (AIService.isProfileComplete(aiResponse.extractedData)) {
        setIsProfileComplete(true);

        // Validate the complete profile
        const validation = await AIService.validateProfileCompletion(
          aiResponse.extractedData
        );

        if (validation.isValid) {
          const profileSummary: Message = {
            id: generateId(),
            text: `Perfect! Here's your completed profile:\n\nName: ${aiResponse.extractedData.name}\nAge: ${aiResponse.extractedData.age}\nGender: ${aiResponse.extractedData.gender}\nLocation: ${aiResponse.extractedData.location}\n\nYour profile has been successfully created!`,
            timestamp: new Date(),
            sender: "system",
          };

          setTimeout(() => {
            setMessages((prev) => [...prev, profileSummary]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }, 1000);
        } else {
          // Profile validation failed, show errors and continue
          const errorMessage: Message = {
            id: generateId(),
            text: `I found some issues with the profile: ${validation.errors.join(
              ", "
            )}. Let's fix these.`,
            timestamp: new Date(),
            sender: "system",
          };

          setTimeout(() => {
            setMessages((prev) => [...prev, errorMessage]);
          }, 1000);

          setIsProfileComplete(false);
        }
      } else {
        // Continue conversation
        const systemMessage: Message = {
          id: generateId(),
          text: aiResponse.chatResponse,
          timestamp: new Date(),
          sender: "system",
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, systemMessage]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing message:", error);

      // Fallback error message
      const errorMessage: Message = {
        id: generateId(),
        text: "Sorry, I had trouble processing that. Could you try again?",
        timestamp: new Date(),
        sender: "system",
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, errorMessage]);
      }, 1000);
    } finally {
      setIsProcessing(false);
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet.</Text>
      <Text style={styles.emptySubtext}>Start a conversation!</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyMessagesContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim().length === 0 || isProcessing) &&
              styles.sendButtonDisabled,
          ]}
          onPress={() => sendMessage()}
          disabled={inputText.trim().length === 0 || isProcessing}
        >
          <Text
            style={[
              styles.sendButtonText,
              (inputText.trim().length === 0 || isProcessing) &&
                styles.sendButtonTextDisabled,
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: "#F8F8F8",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#8E8E93",
  },
});
