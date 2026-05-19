/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  FaBlog,
  FaBox,
  FaBullhorn,
  FaCalendarCheck,
  FaCarSide,
  FaChevronDown,
  FaCog,
  FaEdit,
  FaEnvelopeOpenText,
  FaCreditCard,
  FaChartLine,
  FaDatabase,
  FaGlobeAfrica,
  FaPassport,
  FaHotel,
  FaImages,
  FaInbox,
  FaLink,
  FaLock,
  FaHandshake,
  FaQuestionCircle,
  FaSearch,
  FaTruck,
  FaRetweet,
  FaRoute,
  FaShieldAlt,
  FaShareAlt,
  FaSignOutAlt,
  FaTags,
  FaUsers,
  FaWallet,
  FaNetworkWired,
} from "react-icons/fa";

import Logo from "../../assets/maz-logo.jpeg";

const groupedMenuItems = [
  {
    id: "content",
    label: "Content",
    items: [
      { id: "packages", label: "Packages", icon: <FaBox /> },
      { id: "blogs", label: "Blogs", icon: <FaBlog /> },
      { id: "gallery", label: "Gallery", icon: <FaImages /> },
      { id: "faqs", label: "FAQs", icon: <FaQuestionCircle /> },
      { id: "visionaries", label: "Visionaries", icon: <FaUsers /> },
      { id: "filters", label: "Filters", icon: <FaTags /> },
    ],
  },
  {
    id: "growth",
    label: "Growth Suite",
    items: [
      { id: "social-accounts", label: "Channels", icon: <FaLink />, accessKey: "socialAccounts" },
      { id: "social-posts", label: "Social Posts", icon: <FaShareAlt />, accessKey: "socialPosts" },
      { id: "distribution", label: "Distribution", icon: <FaRoute /> },
      { id: "repurposing", label: "Repurposing", icon: <FaRetweet />, accessKey: "repurposing" },
      { id: "campaigns", label: "Campaigns", icon: <FaBullhorn />, accessKey: "campaigns" },
      { id: "repeat-customers", label: "Repeat Customers", icon: <FaUsers />, accessKey: "repeatCustomerAutomation" },
      { id: "reputation", label: "Reputation Guardian", icon: <FaShieldAlt />, accessKey: "reviewAutomation" },
      { id: "subscription", label: "Subscription", icon: <FaWallet /> },
    ],
  },
  {
    id: "sales",
    label: "Inbox And Sales",
    items: [
      { id: "lead-inbox", label: "Lead Inbox", icon: <FaInbox />, accessKey: "leadInbox" },
      { id: "email-inbox", label: "Unified Inbox", icon: <FaEnvelopeOpenText />, accessKey: "unifiedInbox" },
      { id: "email-foundation", label: "Email Integrations", icon: <FaEnvelopeOpenText />, accessKey: "unifiedInbox" },
      { id: "inquiries", label: "Inquiries", icon: <FaQuestionCircle /> },
      { id: "contact-messages", label: "Contact Messages", icon: <FaEnvelopeOpenText /> },
      { id: "bookings", label: "Bookings", icon: <FaCalendarCheck /> },
      { id: "plan-my-trip", label: "Plan My Trip", icon: <FaRoute /> },
    ],
  },
  {
    id: "site",
    label: "Website Content",
    items: [
      { id: "page-content", label: "Homepage Content", icon: <FaEdit /> },
      { id: "settings", label: "Site Settings", icon: <FaCog /> },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "marketplace-availability", label: "Availability", icon: <FaCalendarCheck /> },
      { id: "guide-drivers", label: "Guides & Drivers", icon: <FaTruck />, accessKey: "guideDriverManagement" },
      { id: "accommodations", label: "Accommodations", icon: <FaHotel />, accessKey: "accommodationCoordination" },
      { id: "airport-pickups", label: "Airport Pickups", icon: <FaCarSide />, accessKey: "airportPickupCoordination" },
      { id: "partners", label: "Partner Portal", icon: <FaHandshake />, accessKey: "partnerPortal" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      { id: "payments", label: "Payments", icon: <FaCreditCard />, accessKey: "paymentAutomation" },
      { id: "dynamic-pricing", label: "Dynamic Pricing", icon: <FaChartLine />, accessKey: "dynamicPricingEngine" },
      { id: "data-platform", label: "Data Platform", icon: <FaDatabase /> },
    ],
  },
  {
    id: "guest-assist",
    label: "Guest Assist",
    items: [
      { id: "language-assistant", label: "Languages", icon: <FaGlobeAfrica />, accessKey: "multilingualAiAssistant" },
      { id: "travel-docs", label: "Travel Docs", icon: <FaPassport />, accessKey: "travelDocumentationAssistant" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { id: "ecosystem-intelligence", label: "Ecosystem", icon: <FaNetworkWired /> },
      { id: "attribution-intelligence", label: "Commercial ROI", icon: <FaChartLine /> },
      { id: "competitor-intelligence", label: "Competitors", icon: <FaSearch />, accessKey: "competitorIntelligence" },
    ],
  },
];

const getGroupIdByTab = (tabId) =>
  groupedMenuItems.find((group) => group.items.some((item) => item.id === tabId))?.id || "content";

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  handleLogout,
  isOpen,
  setIsOpen,
  featureAccess = {},
  onLockedFeature,
}) => {
  const [openGroups, setOpenGroups] = useState(() => ({
    content: true,
    growth: true,
    sales: false,
    site: false,
    operations: false,
    revenue: false,
    "guest-assist": false,
    intelligence: false,
  }));

  const activeGroupId = useMemo(() => getGroupIdByTab(activeTab), [activeTab]);

  useEffect(() => {
    setOpenGroups((current) => ({
      ...current,
      [activeGroupId]: true,
    }));
  }, [activeGroupId]);

  const handleItemClick = (item) => {
    const isLocked = item.accessKey && featureAccess[item.accessKey] === false;

    if (isLocked) {
      onLockedFeature?.(item);
      return;
    }

    setActiveTab(item.id);
  };

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-zinc-200 bg-white text-zinc-950 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-5">
          <div className="flex items-center gap-4">
            <img
              src={Logo}
              alt="Admin Logo"
              className="h-9 w-9 rounded-xl border border-zinc-200 object-cover"
            />
            <div>
              <h2 className="font-heading text-sm font-black uppercase tracking-tight text-zinc-950">
                MAZ Expeditions
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Workspace
              </p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {groupedMenuItems.map((group) => {
            const isOpenGroup = Boolean(openGroups[group.id]);
            const groupHasActiveTab = group.items.some((item) => item.id === activeTab);

            return (
              <div
                key={group.id}
                className={`rounded-xl border transition-colors ${
                  groupHasActiveTab ? "border-zinc-300 bg-zinc-50" : "border-transparent bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {group.label}
                    </p>
                  </div>
                  <FaChevronDown
                    className={`text-xs text-zinc-400 transition-transform ${
                      isOpenGroup ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpenGroup && (
                  <div className="space-y-1 px-2 pb-2">
                    {group.items.map((item) => {
                      const isLocked = item.accessKey && featureAccess[item.accessKey] === false;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                            activeTab === item.id
                              ? "bg-zinc-950 text-white shadow-sm"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">
                              <FaLock className="text-[9px]" />
                              Locked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <FaSignOutAlt className="text-sm" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
