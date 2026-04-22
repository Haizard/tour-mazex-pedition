import { useEffect, useMemo, useState } from "react";
import {
  FaBars,
  FaBlog,
  FaBox,
  FaBullhorn,
  FaCalendarCheck,
  FaChevronDown,
  FaCog,
  FaEdit,
  FaEnvelopeOpenText,
  FaImages,
  FaInbox,
  FaLink,
  FaLock,
  FaQuestionCircle,
  FaRetweet,
  FaRoute,
  FaShareAlt,
  FaSignOutAlt,
  FaTags,
  FaUsers,
  FaWallet,
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
      { id: "repurposing", label: "Repurposing", icon: <FaRetweet />, accessKey: "repurposing" },
      { id: "campaigns", label: "Campaigns", icon: <FaBullhorn />, accessKey: "campaigns" },
      { id: "subscription", label: "Subscription", icon: <FaWallet /> },
    ],
  },
  {
    id: "sales",
    label: "Inbox And Sales",
    items: [
      { id: "lead-inbox", label: "Lead Inbox", icon: <FaInbox />, accessKey: "leadInbox" },
      { id: "email-inbox", label: "Email Inbox", icon: <FaEnvelopeOpenText /> },
      { id: "inquiries", label: "Inquiries", icon: <FaQuestionCircle /> },
      { id: "contact-messages", label: "Contact Messages", icon: <FaEnvelopeOpenText /> },
      { id: "bookings", label: "Bookings", icon: <FaCalendarCheck /> },
      { id: "plan-my-trip", label: "Plan My Trip", icon: <FaRoute /> },
    ],
  },
  {
    id: "site",
    label: "Site Setup",
    items: [
      { id: "page-builder", label: "Page Builder", icon: <FaEdit /> },
      { id: "navigation", label: "Navigation", icon: <FaBars /> },
      { id: "settings", label: "Site Settings", icon: <FaCog /> },
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
          className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div className="flex items-center gap-4">
            <img
              src={Logo}
              alt="Admin Logo"
              className="h-10 w-10 rounded-full object-fill ring-2 ring-primary/30"
            />
            <div>
              <h2 className="font-heading text-lg font-black uppercase tracking-tighter">
                MAZ Expeditions
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Admin Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-4 py-8">
          {groupedMenuItems.map((group) => {
            const isOpenGroup = Boolean(openGroups[group.id]);
            const groupHasActiveTab = group.items.some((item) => item.id === activeTab);

            return (
              <div
                key={group.id}
                className={`rounded-2xl border ${
                  groupHasActiveTab ? "border-primary/40 bg-white/5" : "border-white/5 bg-slate-950/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
                      Menu Group
                    </p>
                    <p className="mt-1 text-sm font-black uppercase tracking-wider text-white">
                      {group.label}
                    </p>
                  </div>
                  <FaChevronDown
                    className={`text-sm text-slate-400 transition-transform ${
                      isOpenGroup ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpenGroup && (
                  <div className="space-y-2 border-t border-white/5 px-3 py-3">
                    {group.items.map((item) => {
                      const isLocked = item.accessKey && featureAccess[item.accessKey] === false;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                            activeTab === item.id
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
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

        <div className="border-t border-white/5 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-400/10"
          >
            <FaSignOutAlt className="text-lg" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
