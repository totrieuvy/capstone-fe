import React, { useState } from "react";
import { Input, Tag, Spin } from "antd";
import { SendOutlined, CloseOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import "./AiChat.scss";

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
      const res = await api.post("/api/chat/ai", { message: msg });
      const reply = res.data?.message || "Xin lỗi, mình chưa hiểu ý bạn 😅";
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

      const audio = document.createElement("audio");
      audio.src = audioUrl;
      audio.autoplay = true;
      audio.style.display = "none";

      const old = document.getElementById("fpt-tts-audio");
      if (old) old.remove();

      audio.id = "fpt-tts-audio";
      document.body.appendChild(audio);

      audio.onended = () => audio.remove();
    } catch (err) {
      console.error("FPT TTS error:", err);
    }
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
              <div key={i} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
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
                <SendOutlined
                  onClick={() => sendMessage(input)}
                  style={{
                    cursor: "pointer",
                    fontSize: 18,
                    color: "#a47148",
                  }}
                />
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;
