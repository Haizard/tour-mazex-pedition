import SerengetiImg from "../assets/momentlion.jpg";
import NgorongoroImg from "../assets/rhino.jpg";
import TarangireImg from "../assets/tembo.jpg";
import ManyaraImg from "../assets/travel-cover2.jpg";
import NatronImg from "../assets/Kilimanjaro.jpg";
import { DESTINATION_META } from "./destinationMeta";

const destinationImages = {
  serengeti: SerengetiImg,
  ngorongoro: NgorongoroImg,
  tarangire: TarangireImg,
  manyara: ManyaraImg,
  natron: NatronImg,
};

export const DESTINATIONS = Object.fromEntries(
  Object.entries(DESTINATION_META).map(([slug, destination]) => [
    slug,
    {
      ...destination,
      image: destinationImages[slug],
    },
  ]),
);

export const getDestinationBySlug = (slug = "") =>
  DESTINATIONS[slug?.toLowerCase()] || null;
