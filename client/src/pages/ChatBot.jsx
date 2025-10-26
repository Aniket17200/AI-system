// src/components/ChatBot.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSend, FiAlertCircle, FiLoader, FiTrendingUp } from "react-icons/fi";
import { toast } from "react-toastify";
import axiosInstance from "../../axios";
import { AiOutlineClose } from "react-icons/ai";

const ChatBot = ({ onAnalysisComplete, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user ID from localStorage or auth context
        const storedUserId = localStorage.getItem("userId");
        if (!storedUserId) {
          throw new Error("User not authenticated");
        }
        setUserId(storedUserId);

        // Clear cache to ensure fresh data
        try {
          await axiosInstance.post(`/chat/clear-cache/${storedUserId}`);
        } catch (cacheErr) {
          console.warn("Could not clear cache:", cacheErr);
        }

        // Load suggested questions
        const { data: suggestionsData } = await axiosInstance.get(
          `/chat/suggestions/${storedUserId}`
        );
        if (suggestionsData.success) {
          setSuggestions(suggestionsData.data);
        }

        setMessages([
          {
            sender: "bot",
            text: "👋 Hi! I'm your AI business analyst with real-time data. I can help you understand your revenue, profit, ROAS, orders, customers, shipping, and more. What would you like to know?",
            isAnalysis: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setError("Failed to initialize AI assistant");
        toast.error("Could not connect to AI service");
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [onAnalysisComplete]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !userId || isLoading) return;

    const userMessage = {
      sender: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        userId: userId,
        message: currentInput,
        conversationHistory: conversationHistory,
      };

      const { data: response } = await axiosInstance.post(
        "/chat/chat",
        payload
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to get AI response");
      }

      const aiResponse = response.data;
      const botMessage = {
        sender: "bot",
        text: aiResponse.message,
        isAnalysis: true,
        timestamp: new Date().toISOString(),
        context: aiResponse.context,
        responseTime: aiResponse.responseTime,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update conversation history (keep last 6 messages for context)
      setConversationHistory((prev) => [
        ...prev.slice(-5),
        { role: "user", content: currentInput },
        { role: "assistant", content: aiResponse.message },
      ]);

      // Mock service is used silently as fallback if needed
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Sorry, I encountered an error processing your request.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I encountered an error. Please try again or rephrase your question.",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId, conversationHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isReady = !!userId;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-black to-emerald-900 text-white rounded-lg shadow-lg overflow-hidden border-none">
      <div className="bg-black/20 p-4 text-white">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Analytics Assistant</h2>
          <button
            onClick={onClose}
            className="text-white text-xl hover:text-green-400 transition-colors"
            title="Close chatbot"
          >
            <AiOutlineClose />
          </button>
        </div>
        <p className="text-xs opacity-80">
          {isReady ? "Ready to answer your questions" : "Initializing assistant..."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.timestamp}-${idx}`}
            className={`flex mb-4 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender !== "user" && (
              <div className="flex flex-col items-center mr-2">
                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full mb-1">
                  Admin
                </div>
              </div>
            )}
            <div
              className={`max-w-70%] rounded-2xl px-4 py-3 text-sm shadow-md relative ${
                msg.sender === "user"
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-none"
                  : msg.isError
                  ? "bg-red-800 text-red-100 rounded-bl-none"
                  : "bg-gray-800/60 backdrop-blur-md text-gray-100 rounded-bl-none"
              }`}
            >
              {msg.text.split("\n").map((line, i) => (
                <p key={i} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </p>
              ))}
              <div className="text-xs mt-2 text-right opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            {msg.sender === "user" && (
              <div className="flex flex-col items-center ml-2">
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full mb-1">
                  You
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 text-sm max-w-[85%]">
              <div className="flex items-center space-x-2 text-green-400">
                <FiLoader className="animate-spin" />
                <span>Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length <= 1 && suggestions.length > 0 && (
        <div className="px-4 pb-2">
          <h3 className="text-xs text-gray-400 mb-2 flex items-center">
            <FiTrendingUp className="mr-1" />
            SUGGESTED QUESTIONS
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.slice(0, 5).map((question, i) => (
              <button
                key={i}
                onClick={() => setInput(question)}
                className="text-xs text-left p-2 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 disabled:opacity-50 transition-colors"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className=" p-3 bg-black/20">
        {error && (
          <div className="flex items-center text-red-400 text-xs mb-2">
            <FiAlertCircle className="mr-1" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isReady}
            placeholder={
              isLoading
                ? "Processing..."
                : !isReady
                ? "Initializing assistant..."
                : "Ask about orders, revenue, ads, or deliveries..."
            }
            className="flex-1 bg-black/20 backdrop-blur-md rounded-lg px-2 py-2 text-white focus:outline-none focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !isReady}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;