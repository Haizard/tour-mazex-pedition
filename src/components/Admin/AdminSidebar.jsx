import React from "react";
import {
    FaBox,
    FaBlog,
    FaImages,
    FaCalendarCheck,
    FaBars,
    FaQuestionCircle,
    FaRoute,
    FaEnvelopeOpenText,
    FaTags,
    FaUsers,
    FaSignOutAlt,
    FaEdit,
    FaCog
} from "react-icons/fa";

import Logo from "../../assets/maz-logo.jpeg";


const AdminSidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
    const menuItems = [
        { id: "packages", label: "Packages", icon: <FaBox /> },
        { id: "blogs", label: "Blogs", icon: <FaBlog /> },
        { id: "site-editor", label: "Site Editor", icon: <FaEdit /> },
        { id: "page-builder", label: "Page Builder", icon: <FaEdit /> },
        { id: "navigation", label: "Navigation", icon: <FaBars /> },
        { id: "gallery", label: "Gallery", icon: <FaImages /> },
        { id: "bookings", label: "Bookings", icon: <FaCalendarCheck /> },
        { id: "inquiries", label: "Inquiries", icon: <FaQuestionCircle /> },
        { id: "contact-messages", label: "Contact Messages", icon: <FaEnvelopeOpenText /> },
        { id: "plan-my-trip", label: "Plan My Trip", icon: <FaRoute /> },
        { id: "faqs", label: "FAQs", icon: <FaQuestionCircle /> },
        { id: "visionaries", label: "Visionaries", icon: <FaUsers /> },
        { id: "filters", label: "Filters", icon: <FaTags /> },
        { id: "settings", label: "Site Settings", icon: <FaCog /> },
    ];


    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
                {/* Brand */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={Logo}
                            alt="Admin Logo"
                            className="h-10 w-10 rounded-full object-fill ring-2 ring-primary/30"
                        />
                        <div>
                            <h2 className="font-black text-lg font-heading uppercase tracking-tighter">
                                MAZ Expeditions
                            </h2>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest">
                                Admin Portal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-400/10 transition-all"
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
