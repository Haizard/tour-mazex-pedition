const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const normalizeTags = (tags = []) => {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))];
  }

  if (typeof tags === "string") {
    return [
      ...new Set(
        tags
          .split(/[,\n]/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

export const buildEmailAudienceContactPayload = (body = {}) => {
  const email = normalizeEmail(body.email);

  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required for the audience bucket.");
  }

  return {
    email,
    firstName: String(body.firstName || "").trim(),
    lastName: String(body.lastName || "").trim(),
    phone: String(body.phone || "").trim(),
    source: String(body.source || "manual").trim() || "manual",
    status: String(body.status || "subscribed").trim() || "subscribed",
    tags: normalizeTags(body.tags),
    notes: String(body.notes || "").trim(),
    metadata: body.metadata || {},
  };
};

export const buildAudienceImportCandidates = ({
  inquiries = [],
  contactMessages = [],
} = {}) => {
  const audience = new Map();

  const addCandidate = (candidate) => {
    const email = normalizeEmail(candidate.email);
    if (!email || !email.includes("@")) {
      return;
    }

    const existing = audience.get(email) || {
      email,
      firstName: "",
      lastName: "",
      phone: "",
      source: candidate.source,
      status: "subscribed",
      tags: [],
      notes: "",
      metadata: {},
    };

    existing.firstName = existing.firstName || candidate.firstName || "";
    existing.lastName = existing.lastName || candidate.lastName || "";
    existing.phone = existing.phone || candidate.phone || "";
    existing.source = existing.source || candidate.source || "imported";
    existing.tags = normalizeTags([...(existing.tags || []), ...(candidate.tags || [])]);
    existing.metadata = {
      ...(existing.metadata || {}),
      ...(candidate.metadata || {}),
    };

    audience.set(email, existing);
  };

  for (const inquiry of inquiries || []) {
    addCandidate({
      email: inquiry.email,
      firstName: inquiry.firstName || inquiry.name?.split(" ")?.[0] || "",
      lastName:
        inquiry.lastName ||
        inquiry.name?.split(" ")?.slice(1).join(" ") ||
        "",
      phone: inquiry.phone || "",
      source: inquiry.sourceChannel || "inquiry",
      tags: ["lead", inquiry.contactPreference || "", inquiry.sourceChannel || ""],
      metadata: {
        inquiryId: inquiry._id ? String(inquiry._id) : "",
      },
    });
  }

  for (const message of contactMessages || []) {
    addCandidate({
      email: message.email,
      firstName: message.name?.split(" ")?.[0] || "",
      lastName: message.name?.split(" ")?.slice(1).join(" ") || "",
      phone: message.phone || "",
      source: "contact-message",
      tags: ["website-contact"],
      metadata: {
        contactMessageId: message._id ? String(message._id) : "",
      },
    });
  }

  return [...audience.values()];
};
