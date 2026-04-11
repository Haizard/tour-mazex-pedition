import SerengetiImg from "../assets/places/Serengeti2.jpg";
import NgorongoroImg from "../assets/places/Ngorongoro.jpg";
import TarangireImg from "../assets/places/tarangirepic.jpg";
import ManyaraImg from "../assets/places/Manyara.jpg";
import NatronImg from "../assets/places/NatronLake.jpg";
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
