import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCustomerSupportContext,
  selectCampaignEntries,
  selectFaqEntries,
  selectSiteContentEntries,
  rankContentByVectorMatches,
  selectLanguageAssistantProfile,
  selectTravelDocumentationGuides,
} from "../utils/customerSupportChatbot.js";

test("selectLanguageAssistantProfile matches active locale packs for the visitor", () => {
  const match = selectLanguageAssistantProfile({
    profiles: [
      {
        language: "French",
        localeCode: "fr-FR",
        useCases: ["sales replies"],
        glossary: ["safari", "migration"],
        status: "active",
      },
      {
        language: "German",
        localeCode: "de-DE",
        status: "active",
      },
    ],
    visitorProfile: {
      preferredLocale: "fr-FR",
    },
    message: "Bonjour, je veux un safari prive",
  });

  assert.equal(match?.language, "French");
});

test("selectLanguageAssistantProfile prefers pgvector-ranked matches when available", () => {
  const match = selectLanguageAssistantProfile({
    profiles: [
      {
        _id: "profile-1",
        language: "French",
        localeCode: "fr-FR",
        status: "active",
      },
      {
        _id: "profile-2",
        language: "German",
        localeCode: "de-DE",
        status: "active",
      },
    ],
    visitorProfile: {},
    message: "hello",
    vectorMatchIds: ["profile-2"],
  });

  assert.equal(match?._id, "profile-2");
});

test("selectTravelDocumentationGuides pulls market-relevant guidance", () => {
  const guides = selectTravelDocumentationGuides({
    guides: [
      {
        market: "France",
        topic: "Visa",
        requirementSummary: "French passport holders can use the Tanzania eVisa flow.",
        sourceLabel: "Embassy update",
        status: "active",
      },
      {
        market: "United States",
        topic: "Vaccines",
        requirementSummary: "Carry yellow fever proof when arriving from a risk area.",
        status: "active",
      },
    ],
    visitorProfile: {
      market: "France",
    },
    message: "Do I need a visa for Tanzania?",
  });

  assert.equal(guides.length, 1);
  assert.equal(guides[0].market, "France");
  assert.equal(guides[0].topic, "Visa");
});

test("selectTravelDocumentationGuides prefers pgvector-ranked guide ids when available", () => {
  const guides = selectTravelDocumentationGuides({
    guides: [
      {
        _id: "guide-1",
        market: "France",
        topic: "Visa",
        requirementSummary: "French passport holders can use the Tanzania eVisa flow.",
        status: "active",
      },
      {
        _id: "guide-2",
        market: "United States",
        topic: "Vaccines",
        requirementSummary: "Carry yellow fever proof when arriving from a risk area.",
        status: "active",
      },
    ],
    visitorProfile: {},
    message: "hello",
    vectorMatchIds: ["guide-2"],
  });

  assert.equal(guides[0]._id, "guide-2");
});

test("selectFaqEntries prefers pgvector-ranked faq ids when available", () => {
  const faqs = selectFaqEntries({
    faqs: [
      {
        _id: "faq-1",
        question: "Do I need a visa for Tanzania?",
        answer: "Most travelers can use the eVisa route.",
        category: "Visa",
      },
      {
        _id: "faq-2",
        question: "When is the best safari season?",
        answer: "June to October is a classic dry-season window.",
        category: "Safari planning",
      },
    ],
    message: "hello",
    vectorMatchIds: ["faq-2"],
  });

  assert.equal(faqs[0]._id, "faq-2");
});

test("selectCampaignEntries prefers pgvector-ranked campaign ids when available", () => {
  const campaigns = selectCampaignEntries({
    campaigns: [
      {
        _id: "campaign-1",
        title: "Migration Priority",
        summary: "Push urgency around migration timing.",
        channels: ["email"],
        status: "active",
      },
      {
        _id: "campaign-2",
        title: "Family Escape",
        summary: "Promote school-holiday packages.",
        channels: ["whatsapp"],
        status: "scheduled",
      },
    ],
    message: "hello",
    vectorMatchIds: ["campaign-2"],
  });

  assert.equal(campaigns[0]._id, "campaign-2");
});

test("selectSiteContentEntries prefers pgvector-ranked page and home content ids when available", () => {
  const siteContent = selectSiteContentEntries({
    pageConfigs: [
      {
        _id: "page-1",
        pageType: "home",
        title: "Safari Home",
        seo: { description: "Luxury Tanzania journeys." },
        sections: [],
      },
    ],
    homeContents: [
      {
        _id: "home-1",
        section: "welcome",
        title: "Tailor-Made Tanzania",
        description: "We shape private safari itineraries around your pace.",
      },
    ],
    message: "custom safari planning",
    vectorMatchIds: ["home-1", "page-1"],
  });

  assert.deepEqual(
    siteContent.map((entry) => entry._id),
    ["home-1", "page-1"]
  );
});

test("buildCustomerSupportContext includes multilingual and documentation instructions when enabled", () => {
  const result = buildCustomerSupportContext({
    tenantName: "MAZ Expeditions",
    tours: [
      {
        title: "Serengeti Migration Escape",
        location: "Serengeti",
        duration: "6 days",
        price: 2400,
        description: "A migration-focused safari.",
      },
    ],
    blogs: [
      {
        title: "Great Migration Update",
        category: "Wildlife",
        content: "River crossings are active in the north.",
      },
    ],
    message: "Bonjour, what documents do I need for a Tanzania safari?",
    visitorProfile: {
      preferredLocale: "fr-FR",
      market: "France",
    },
    languageProfiles: [
      {
        language: "French",
        localeCode: "fr-FR",
        tone: "warm and reassuring",
        glossary: ["eVisa", "safari prive"],
        status: "active",
      },
    ],
    travelDocumentationGuides: [
      {
        market: "France",
        topic: "Visa",
        requirementSummary: "French travelers should use the official Tanzania eVisa process.",
        sourceLabel: "Tanzania Immigration",
        status: "active",
      },
    ],
    faqs: [
      {
        _id: "faq-1",
        question: "Do French travelers need a visa?",
        answer: "French travelers should use the official Tanzania eVisa process.",
        category: "Visa",
      },
    ],
    campaigns: [
      {
        _id: "campaign-1",
        title: "Migration Priority",
        summary: "Push urgency around migration timing.",
        channels: ["email", "whatsapp"],
        status: "active",
      },
    ],
    pageConfigs: [
      {
        _id: "page-1",
        pageType: "home",
        title: "Safari Home",
        seo: {
          description: "Luxury Tanzania journeys tailored around your travel style.",
        },
        sections: [],
      },
    ],
    homeContents: [
      {
        _id: "home-1",
        section: "welcome",
        title: "Tailor-Made Tanzania",
        description: "We shape private safari itineraries around your pace, style, and goals.",
      },
    ],
    vectorMatches: {
      faqIds: ["faq-1"],
      campaignIds: ["campaign-1"],
      pageConfigIds: ["page-1"],
      homeContentIds: ["home-1"],
    },
    featureAccess: {
      multilingualAiAssistant: true,
      travelDocumentationAssistant: true,
    },
  });

  assert.equal(result.assistantSignals.matchedLanguage?.language, "French");
  assert.equal(result.assistantSignals.travelDocumentation.length, 1);
  assert.equal(
    result.systemInstruction.includes("Reply in French"),
    true
  );
  assert.equal(
    result.systemInstruction.includes("official Tanzania eVisa process"),
    true
  );
  assert.equal(
    result.systemInstruction.includes("Relevant frequently asked questions"),
    true
  );
  assert.equal(
    result.systemInstruction.includes("Current commercial campaigns"),
    true
  );
  assert.equal(
    result.systemInstruction.includes("Live site messaging"),
    true
  );
  assert.equal(
    result.systemInstruction.includes("Tailor-Made Tanzania"),
    true
  );
});

test("rankContentByVectorMatches moves vector-ranked tours and blogs to the front", () => {
  const items = rankContentByVectorMatches({
    items: [
      { _id: "tour-1", title: "Serengeti" },
      { _id: "tour-2", title: "Zanzibar" },
      { _id: "tour-3", title: "Kilimanjaro" },
    ],
    vectorMatchIds: ["tour-3", "tour-1"],
  });

  assert.deepEqual(
    items.map((item) => item._id),
    ["tour-3", "tour-1", "tour-2"]
  );
});
