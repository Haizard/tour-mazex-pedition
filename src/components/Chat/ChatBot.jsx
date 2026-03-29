import React, { useState, useEffect, useRef } from "react";
import { IoSend, IoClose, IoChatbubbleEllipses } from "react-icons/io5";
import { sendChatMessage } from "../../services/api";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "model",
      content:
        "Hi! I'm your Makolo Adventure assistant. Ready to plan your dream safari?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: message,
        history: chatHistory,
      });
      setChatHistory((prev) => [
        ...prev,
        { role: "model", content: response.data.message },
      ]);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        "Oops! I'm having a technical moment. Please try again or message us on WhatsApp!";
      setChatHistory((prev) => [...prev, { role: "model", content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl w-[350px] md:w-[400px] h-[500px] rounded-[32px] shadow-2xl border border-white/20 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <IoChatbubbleEllipses className="text-xl" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tighter text-sm">
                  Makolo AI Guide
                </h3>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">
                  Always Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
          >
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === "user"
                      ? "bg-primary text-white rounded-tr-none shadow-lg"
                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t bg-gray-50 flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
            />
            <button
              type="submit"
              className="bg-primary text-white p-3 rounded-xl shadow-lg hover:scale-105 transition"
            >
              <IoSend />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white p-4 rounded-full shadow-2xl border-4 border-primary text-primary hover:scale-110 transition-all duration-300 ${isOpen ? "rotate-90 opacity-0" : ""}`}
      >
        <IoChatbubbleEllipses size={32} />
      </button>
    </div>
  );
};

export default ChatBot;
