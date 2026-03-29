import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, default: "Safari Frequently Asked Questions", trim: true },
  },
  { timestamps: true }
);

const Faq = mongoose.model("Faq", faqSchema);
export default Faq;
