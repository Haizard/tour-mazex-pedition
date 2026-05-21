import { useState, useEffect, useRef } from "react";
import { IoSend, IoClose, IoChatbubbleEllipses } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import { sendChatMessage } from "../../services/api";
import { buildChatVisitorProfile } from "./chatAttribution.js";
import { buildTenantScopedPath } from "../../utils/tenantRoutes.js";

const CHAT_SESSION_STORAGE_KEY = "tourmazeChatSessionId";

const ensureChatSessionId = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, generated);
  return generated;
};

const getVisitorProfile = () => {
  if (typeof window === "undefined") {
    return {};
  }

  return buildChatVisitorProfile({
    navigatorLanguage: window.navigator?.language || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    locationLike: window.location,
    referrer: window.document?.referrer || "",
  });
};

const ChatBot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "model",
      content:
        "Hi! I'm your MAZ Expeditions assistant. Ready to plan your dream safari?",
      salesAssistant: null,
      assistantSignals: null,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    setSessionId(ensureChatSessionId());
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const nextSessionId = sessionId || ensureChatSessionId();
    if (!sessionId && nextSessionId) {
      setSessionId(nextSessionId);
    }

    const userMsg = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: message,
        history: chatHistory,
        sessionId: nextSessionId,
        visitorProfile: getVisitorProfile(),
      });
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: response.data.message,
          salesAssistant: response.data.salesAssistant || null,
          assistantSignals: response.data.assistantSignals || null,
        },
      ]);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        "Oops! I'm having a technical moment. Please try again or message us on WhatsApp!";
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: errorMsg,
          salesAssistant: null,
          assistantSignals: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl w-[320px] md:w-[400px] h-[450px] md:h-[500px] rounded-[24px] md:rounded-[32px] shadow-2xl border border-white/20 mb-3 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <IoChatbubbleEllipses className="text-xl" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tighter text-sm">
                  MAZ Expeditions AI Guide
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
                  {msg.role === "model" && msg.salesAssistant && (
                    <div className="mt-3 space-y-3 rounded-2xl bg-white/70 p-3 text-gray-800">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                        Best Next Step
                      </p>
                      <p className="text-xs font-bold leading-5">
                        {msg.salesAssistant.summary}
                      </p>
                      {msg.salesAssistant.recommendedNextStep && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                          Recommended: {msg.salesAssistant.recommendedNextStep.replace(/-/g, " ")}
                        </p>
                      )}
                      {msg.salesAssistant.salesStage && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                          Sales Stage: {msg.salesAssistant.salesStage.replace(/-/g, " ")}
                        </p>
                      )}
                      <p className="text-xs leading-5 text-gray-600">
                        {msg.salesAssistant.qualificationQuestion}
                      </p>
                      {msg.salesAssistant.leadCapturePrompt && (
                        <p className="text-[11px] leading-5 text-gray-500">
                          {msg.salesAssistant.leadCapturePrompt}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {msg.salesAssistant.quickActions?.map((action) => (
                          <Link
                            key={`${action.href}-${action.label}`}
                            to={buildTenantScopedPath(action.href, location.pathname)}
                            onClick={() => setIsOpen(false)}
                            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white ${
                              action.kind === "planner" ? "bg-slate-800" : "bg-primary"
                            }`}
                          >
                            {action.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.role === "model" && msg.assistantSignals && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.assistantSignals.matchedLanguage?.language && (
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
                          {msg.assistantSignals.matchedLanguage.language}
                        </span>
                      )}
                      {msg.assistantSignals.travelDocumentation?.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800">
                          Travel Docs Active
                        </span>
                      )}
                      {msg.assistantSignals.preferredLocale && (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                          {msg.assistantSignals.preferredLocale}
                        </span>
                      )}
                    </div>
                  )}
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
        className={`bg-white p-3 rounded-full shadow-xl border-[3px] border-primary text-primary hover:scale-110 transition-all duration-300 ${isOpen ? "rotate-90 opacity-0 pointer-events-none" : ""}`}
      >
        <IoChatbubbleEllipses size={22} />
      </button>
    </div>
  );
};

export default ChatBot;
