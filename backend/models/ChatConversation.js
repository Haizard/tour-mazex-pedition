import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },
    sourceChannel: {
      type: String,
      enum: ["website-chat"],
      default: "website-chat",
    },
    visitorLabel: {
      type: String,
      trim: true,
      default: "Website Visitor",
    },
    visitorEmail: {
      type: String,
      trim: true,
      default: "",
    },
    visitorPhone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "open", "replied", "closed"],
      default: "new",
      index: true,
    },
    lastVisitorMessage: {
      type: String,
      trim: true,
      default: "",
    },
    transcript: [
      {
        role: {
          type: String,
          enum: ["user", "model"],
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

chatConversationSchema.index({ tenantId: 1, sessionId: 1 }, { unique: true });

const ChatConversation =
  mongoose.models.ChatConversation ||
  mongoose.model("ChatConversation", chatConversationSchema);

export default ChatConversation;
