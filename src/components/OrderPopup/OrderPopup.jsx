import React, { useEffect, useState } from "react";
import {
  IoCloseOutline,
  IoPeopleOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { createBooking } from "../../services/api";
import PlanMyTripWizard from "../PlanMyTrip/PlanMyTripWizard";

const OrderPopup = ({
  isVisible,
  setOrderPopupVisible,
  packageTour,
  packagePrice,
}) => {
  const isTailorMadeMode = !packageTour && !packagePrice;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    packageTour: packageTour || "Custom Inquiry",
    pax: 1,
    totalPrice: packagePrice || 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (packagePrice) {
      setFormData((prev) => ({
        ...prev,
        packageTour: packageTour || prev.packageTour,
        totalPrice: prev.pax * packagePrice,
      }));
    }
  }, [formData.pax, packagePrice, packageTour]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBooking(formData);
      setSuccess(true);
      setTimeout(() => {
        setOrderPopupVisible(false);
        setSuccess(false);
        setFormData((prev) => ({
          ...prev,
          name: "",
          email: "",
          address: "",
          phone: "",
          pax: 1,
        }));
      }, 2000);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to submit booking. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 p-4 md:p-6 backdrop-blur-sm">
      <div
        className={`relative shadow-2xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden ${
          isTailorMadeMode
            ? "w-full max-w-4xl max-h-[85vh]"
            : "w-full max-w-[420px] max-h-[90vh]"
        } flex flex-col`}
      >
        <div
          className={`absolute z-20 cursor-pointer text-2xl transition hover:text-primary ${
            isTailorMadeMode
              ? "right-3 top-3 md:right-5 md:top-5 rounded-full bg-white/90 p-2 shadow-lg"
              : "right-4 top-4"
          }`}
          onClick={() => setOrderPopupVisible(false)}
        >
          <IoCloseOutline />
        </div>

        <div
          className={`flex-1 overflow-y-auto ${
            isTailorMadeMode ? "p-0" : "p-6 md:p-8"
          }`}
        >
          {isTailorMadeMode ? (
            <PlanMyTripWizard
              compact
              showIntro
              onCancel={() => setOrderPopupVisible(false)}
              onSuccess={() => {
                setTimeout(() => {
                  setOrderPopupVisible(false);
                }, 1800);
              }}
            />
          ) : success ? (
            <div className="py-8 md:py-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-green-100 text-3xl md:text-4xl text-green-600">
                ✓
              </div>
              <h2 className="mb-2 text-xl md:text-2xl font-black uppercase text-gray-900">
                Success!
              </h2>
              <p className="text-sm text-gray-500">Your booking request has been sent.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
                  Book Your Spot
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Package:{" "}
                  <span className="font-bold text-primary">
                    {packageTour || "General Inquiry"}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-none bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-none bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-none bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Country"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-none bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="space-y-3 md:space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] md:text-sm font-black uppercase text-gray-400">
                      <IoPeopleOutline className="text-lg" /> Travelers
                    </label>
                    <input
                      type="number"
                      name="pax"
                      min="1"
                      max="100"
                      value={formData.pax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pax: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-16 md:w-20 rounded-xl border bg-white p-2 text-center font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200/50 pt-3 md:pt-4">
                    <p className="flex items-center gap-2 text-[10px] md:text-sm font-black uppercase text-gray-400">
                      <IoWalletOutline className="text-lg" /> Total Bill
                    </p>
                    <p className="text-xl md:text-2xl font-black text-primary">
                      ${formData.totalPrice}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 md:mt-4 w-full rounded-2xl bg-primary py-3.5 md:py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-[2px] disabled:bg-gray-400"
                >
                  {loading ? "Submitting..." : "Confirm & Pay Later"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPopup;
