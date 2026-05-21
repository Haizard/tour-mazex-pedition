/* eslint-disable react/prop-types */
import { FaMagic, FaShieldAlt } from "react-icons/fa";
import {
  getHotelFitExplanation,
  getHotelTrustSummary,
} from "./hotelTrustUtils";

const HotelAiConciergeCard = ({ hotel = {} }) => (
  <div className="rounded-[28px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
      <FaMagic className="text-primary" /> AI hotel concierge
    </p>
    <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900">
      Why this hotel may fit
    </h2>
    <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
      {getHotelFitExplanation(hotel)}
    </p>
    <div className="mt-5 rounded-2xl bg-[#f8f5ee] p-4">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
        <FaShieldAlt /> Grounded trust summary
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        {getHotelTrustSummary(hotel)}
      </p>
    </div>
  </div>
);

export default HotelAiConciergeCard;
