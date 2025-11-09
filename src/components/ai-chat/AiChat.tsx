import React, { useState, useRef } from "react";
import { Input, Tag, Spin } from "antd";
import { SendOutlined, CloseOutlined, AudioOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import "./AiChat.scss";
interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart?: () => void;
  onresult?: (event: CustomSpeechRecognitionEvent) => void;
  onerror?: (event: Event) => void;
  onend?: () => void;
  start: () => void;
  stop: () => void;
}

/* Constructor type */
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

/* Extend window with optional props (some browsers define webkitSpeechRecognition) */
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventResults {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface CustomSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionEventResults;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

const API_KEY = "vyO2uTRbOmJ93JmPD6XmpBN6LUESOdN6";

const AiChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const formatAnswerText = (text: string): string => {
    if (!text) return text;

    return (
      text
        // 1️⃣ Làm đậm tiêu đề nhóm dịch vụ chính
        .replace(/\*\*(Dịch vụ [^*]+):\*\*/g, "<strong>$1</strong>")

        // 2️⃣ Làm đậm tên dịch vụ con
        .replace(/^\*\s+\*\*(.+?):\*\*/gm, "• <strong>$1:</strong>")

        // 3️⃣ Làm đậm **mọi đoạn khác** còn lại
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

        // 4️⃣ Dấu chấm đầu dòng cho các dòng bắt đầu bằng *
        .replace(/^\*\s+(?!<strong>)(.+)$/gm, "• $1")

        // 5️⃣ Xuống dòng cho dễ đọc
        .replace(/\n/g, "<br/>")

        // 6️⃣ Dọn khoảng trắng dư
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const suggestedQuestions = [
    "Tui có hamster gì?",
    "Hamster của tui có khỏe không?",
    "Gợi ý giúp tui dịch vụ phù hợp cho hamster!",
  ];

  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    setChat((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const body = conversationId ? { message: msg, conversationId } : { message: msg };
      const res = await api.post("/api/chat/ai", body);

      let reply = res.data?.data?.message || "Xin lỗi, mình chưa hiểu ý bạn 😅";
      reply = formatAnswerText(reply);

      const newId = res.data?.data?.conversationId;

      if (newId && !conversationId) setConversationId(newId);

      setChat((prev) => [...prev, { sender: "ai", text: reply }]);
      handleTextToSpeech(reply);
    } catch (err) {
      console.error("Chat API error:", err);
      setChat((prev) => [...prev, { sender: "ai", text: "⚠️ Lỗi kết nối server AI" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextToSpeech = async (text: string) => {
    try {
      const res = await fetch("https://api.fpt.ai/hmi/tts/v5", {
        method: "POST",
        headers: {
          "api-key": API_KEY,
          voice: "banmai",
          speed: "0",
        },
        body: text,
      });

      const data = await res.json();
      const audioUrl = data.async;
      const audio = new Audio(audioUrl);
      audio.play().catch((e) => {
        console.warn("TTS play blocked:", e);
      });
    } catch (err) {
      console.error("FPT TTS error:", err);
    }
  };

  const handleStartListening = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Trình duyệt của bạn không hỗ trợ Speech Recognition 😢");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
      // defensive checks
      if (!event?.results || !event.results[0] || !event.results[0][0]) return;
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: Event) => {
      console.error("Speech recognition error:", event);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <>
      {!open && (
        <button className="floating-chat-btn" onClick={() => setOpen(true)}>
          <img
            src="https://i.pinimg.com/736x/c2/e7/5e/c2e75ef38ca2482ca20ba70fc5d8b236.jpg"
            alt="Hamster Chat"
            className="chat-avatar"
          />
        </button>
      )}

      {open && (
        <div className="ai-chat-container">
          <div className="chat-header">
            <div className="chat-title">
              <img
                src="https://i.pinimg.com/736x/c2/e7/5e/c2e75ef38ca2482ca20ba70fc5d8b236.jpg"
                alt="Hamster Avatar"
                className="chat-hamster-icon"
              />
              Hamster AI
            </div>
            <CloseOutlined onClick={() => setOpen(false)} className="close-btn" />
          </div>

          <div className="chat-body">
            {chat.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.sender}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
            ))}

            {loading && (
              <div className="chat-loading">
                <Spin size="small" />
              </div>
            )}
          </div>

          <div className="chat-suggestions">
            {suggestedQuestions.map((q, i) => (
              <Tag key={i} onClick={() => sendMessage(q)} className="suggestion-tag">
                {q}
              </Tag>
            ))}
          </div>

          <div className="chat-input">
            <Input
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => sendMessage(input)}
              suffix={
                <>
                  <div className={`mic-wrapper ${listening ? "listening" : ""}`}>
                    <AudioOutlined
                      onClick={handleStartListening}
                      className="mic-icon"
                      style={{
                        cursor: "pointer",
                        fontSize: 18,
                        marginRight: 8,
                        color: listening ? "#ff4d4f" : "#a47148",
                      }}
                      aria-label={listening ? "Đang ghi âm" : "Bắt đầu ghi âm"}
                    />
                    {listening && <div className="mic-wave" aria-hidden="true"></div>}
                  </div>
                  <SendOutlined
                    onClick={() => sendMessage(input)}
                    style={{
                      cursor: "pointer",
                      fontSize: 18,
                      color: "#a47148",
                    }}
                  />
                </>
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;
