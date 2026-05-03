import React, { useState, useRef } from "react";
import { FaUpload } from "react-icons/fa";
import { uploadMedia } from "../../services/api";
import { useAdminAuth } from "../../context/AdminAuthContext";

const INPUT_CLASS =
  "w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900";

const MediaUploadField = ({ value, onChange, placeholder, id, className = "" }) => {
  const { admin } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("File is too large! Maximum allowed for logos is 4MB to ensure compatibility with all hosting providers.");
      return;
    }


    setUploading(true);
    try {
      // Use tenantId from admin or default to maz-expeditions ID if not found
      const tenantId = admin?.tenantId || "65de1234567890abcdef1234"; 
      
      const response = await uploadMedia(file, tenantId);
      const mediaUrl = response.data.url;
      onChange(mediaUrl);
      alert("Successfully uploaded!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Enter URL or upload a file"}
            className={INPUT_CLASS}
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/mp4,image/*"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`px-4 rounded-2xl flex items-center justify-center transition shadow-sm ${
            uploading 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-primary text-white hover:bg-primary/90"
          }`}
          title="Upload from device"
        >
          <FaUpload className={uploading ? "animate-bounce" : ""} />
        </button>
      </div>
    </div>
  );
};

export default MediaUploadField;
