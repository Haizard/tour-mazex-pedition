import SerengetiImg from "../assets/places/Serengeti2.jpg";
import NgorongoroImg from "../assets/places/Ngorongoro.jpg";
import TarangireImg from "../assets/places/tarangirepic.jpg";
import ManyaraImg from "../assets/places/Manyara.jpg";
import NatronImg from "../assets/places/NatronLake.jpg";

export const DESTINATIONS = {
  serengeti: {
    slug: "serengeti",
    title: "Serengeti National Park",
    image: SerengetiImg,
    intro:
      "Serengeti is Tanzania's most iconic safari destination, known for endless plains, big cat sightings, and the Great Migration. It is ideal for classic game drives, luxury safaris, and photographer-led adventures.",
    aliases: ["serengeti", "serengeti national park", "great migration", "central serengeti"],
    fallbackFaqs: [
      {
        question: "What is Serengeti National Park best known for?",
        answer:
          "Serengeti is best known for the Great Migration, strong year-round predator sightings, and classic open-plain safari experiences.",
      },
      {
        question: "How many days should I spend in Serengeti?",
        answer:
          "Most travelers enjoy 2 to 4 nights, but photographers and migration-focused trips often benefit from a longer stay.",
      },
    ],
  },
  ngorongoro: {
    slug: "ngorongoro",
    title: "Ngorongoro Crater",
    image: NgorongoroImg,
    intro:
      "Ngorongoro Crater offers one of the densest concentrations of wildlife in Africa. It is a compact safari destination that works well for travelers who want excellent game viewing in a short time.",
    aliases: ["ngorongoro", "ngorongoro crater", "crater", "ngorongoro conservation area"],
    fallbackFaqs: [
      {
        question: "Why is Ngorongoro Crater popular on safari itineraries?",
        answer:
          "It gives travelers a strong chance to see a wide variety of wildlife in one game drive, including lion, buffalo, elephant, and rhino.",
      },
      {
        question: "Can Ngorongoro be visited in one day?",
        answer:
          "Yes. Many itineraries include a full-day crater descent, though pairing it with nearby parks creates a more complete safari circuit.",
      },
    ],
  },
  tarangire: {
    slug: "tarangire",
    title: "Tarangire National Park",
    image: TarangireImg,
    intro:
      "Tarangire is famous for giant elephant herds, baobab-dotted landscapes, and excellent dry-season wildlife concentration. It fits beautifully into northern Tanzania safari routes.",
    aliases: ["tarangire", "tarangire national park", "baobab", "elephant herds"],
    fallbackFaqs: [
      {
        question: "What makes Tarangire different from other parks?",
        answer:
          "Tarangire stands out for its large elephant populations, baobab scenery, and quieter feel compared with some of Tanzania's more famous parks.",
      },
      {
        question: "Is Tarangire good for a first safari?",
        answer:
          "Yes. It pairs well with Serengeti, Manyara, and Ngorongoro and gives a strong wildlife experience from the start of a safari circuit.",
      },
    ],
  },
  manyara: {
    slug: "manyara",
    title: "Lake Manyara",
    image: ManyaraImg,
    intro:
      "Lake Manyara is a scenic park with forest, escarpment views, birdlife, and varied habitats in a compact area. It works well as part of a short northern circuit safari.",
    aliases: ["manyara", "lake manyara", "lake manyara national park"],
    fallbackFaqs: [
      {
        question: "What is Lake Manyara best for?",
        answer:
          "Lake Manyara is known for scenic diversity, birdlife, forest habitats, and as a smooth addition to broader northern circuit itineraries.",
      },
      {
        question: "How much time do travelers need in Manyara?",
        answer:
          "Many travelers visit on a day trip or overnight basis, especially when combining it with Tarangire and Ngorongoro.",
      },
    ],
  },
  natron: {
    slug: "natron",
    title: "Lake Natron",
    image: NatronImg,
    intro:
      "Lake Natron offers a more remote and dramatic side of Tanzania, with volcanic scenery, flamingo habitats, and adventurous add-ons that suit travelers seeking something beyond the classic circuit.",
    aliases: ["natron", "lake natron", "ol doinyo lengai"],
    fallbackFaqs: [
      {
        question: "Who is Lake Natron best suited for?",
        answer:
          "It is ideal for adventurous travelers who want dramatic scenery, cultural experiences, and a destination that feels more off the main safari trail.",
      },
      {
        question: "Is Lake Natron usually a standalone trip?",
        answer:
          "It is often combined with Serengeti, Ngorongoro, or active adventures for travelers who want a broader northern Tanzania itinerary.",
      },
    ],
  },
};

export const getDestinationBySlug = (slug = "") =>
  DESTINATIONS[slug?.toLowerCase()] || null;
