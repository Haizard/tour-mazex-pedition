import SafariImg from "../../assets/tembo.jpg";
import TrekkingImg from "../../assets/Kilimanjaro.jpg";
import DayTripImg from "../../assets/momentlion.jpg";
import PrimateImg from "../../assets/primate.png";


export const MENU_IMAGE_BY_KEY = {
  tembo: SafariImg,
  kilimanjaro: TrekkingImg,
  momentlion: DayTripImg,
  primate: PrimateImg,
};


export const FRONTEND_MENU_DEFAULTS = [
  {
    label: "Home",
    link: "/",
    itemType: "link",
    sortOrder: 1,
    children: [],
  },
  {
    label: "Chimpanzee Trekking",
    link: "/packages?type=Chimpanzee",
    itemType: "megamenu",
    categoryKey: "chimpanzee",
    menuTitle: "Primate Trekking Tours",
    imageKey: "primate",

    sortOrder: 2,
    children: [
      { label: "7-Day Gombe Chimpanzee", link: "/packages/gombe-7-day", sortOrder: 1 },
      { label: "9-Day Mahale Mountains", link: "/packages/mahale-9-day", sortOrder: 2 },
      { label: "3-Day Gombe Experience", link: "/packages/gombe-3-day", sortOrder: 3 },
      { label: "4-Day Gombe from Arusha", link: "/packages/gombe-4-day", sortOrder: 4 },
      { label: "5-Day Mahale from Dar", link: "/packages/mahale-5-day", sortOrder: 5 },
      { label: "3-Day Gorilla Trekking", link: "/packages/gorilla-3-day", sortOrder: 6 },
    ],
  },
  {
    label: "Safari",
    link: "/packages?type=Safari",
    itemType: "dropdown",
    categoryKey: "safari",
    sortOrder: 3,
    children: [
      { label: "Our Safari Packages", link: "/packages?type=Safari", sortOrder: 1 },
      { label: "Honeymoon Safaris", link: "/packages?type=Honeymoon", sortOrder: 2 },
      { label: "Family Tours", link: "/packages?type=Family", sortOrder: 3 },
      { label: "Cultural Safari Tours", link: "/packages?type=Cultural", sortOrder: 4 },
      { label: "Cross Country", link: "/packages?type=Cross Country", sortOrder: 5 },
      { label: "Learn More About Safari", link: "/blogs/safari-guide", sortOrder: 6 },
    ],
  },
  {
    label: "Day Trips",
    link: "/packages?type=Day Trip",
    itemType: "megamenu",
    categoryKey: "daytrip",
    menuTitle: "Offered Day Trip Tours",
    imageKey: "momentlion",
    sortOrder: 4,
    children: [
      { label: "Day Trip to Serval Wildlife", link: "/packages/serval-wildlife", sortOrder: 1 },
      { label: "Arusha National Park", link: "/packages/arusha-day-trip", sortOrder: 2 },
      { label: "Tarangire National Park", link: "/packages/tarangire-day-trip", sortOrder: 3 },
      { label: "Lake Manyara National Park", link: "/packages/manyara-day-trip", sortOrder: 4 },
      { label: "Mkomazi National Park", link: "/packages/mkomazi-day-trip", sortOrder: 5 },
      { label: "Ngorongoro Crater", link: "/packages/ngorongoro-day-trip", sortOrder: 6 },
    ],
  },
  {
    label: "Kilimanjaro",
    link: "/packages?type=Trekking",
    itemType: "megamenu",
    categoryKey: "kilimanjaro",
    menuTitle: "Offered Trekking Tours",
    imageKey: "kilimanjaro",
    sortOrder: 5,
    children: [
      { label: "Lemosho Route", link: "/packages/lemosho", sortOrder: 1 },
      { label: "Rongai Route", link: "/packages/rongai", sortOrder: 2 },
      { label: "Machame Route", link: "/packages/machame", sortOrder: 3 },
      { label: "Marangu Route", link: "/packages/marangu", sortOrder: 4 },
      { label: "Northern Circuit", link: "/packages/northern-circuit", sortOrder: 5 },
      { label: "Umbwe Route", link: "/packages/umbwe", sortOrder: 6 },
    ],
  },
  {
    label: "Plan My Trip",
    link: "/plan-my-trip",
    itemType: "link",
    sortOrder: 6,
    children: [],
  },
  {
    label: "Gallery",
    link: "/gallery",
    itemType: "link",
    sortOrder: 7,
    children: [],
  },
  {
    label: "Destinations",
    link: "/destinations",
    itemType: "dropdown",
    categoryKey: "destinations",
    sortOrder: 8,
    children: [
      { label: "Serengeti National Park", link: "/destinations/serengeti", sortOrder: 1 },
      { label: "Ngorongoro Crater", link: "/destinations/ngorongoro", sortOrder: 2 },
      { label: "Tarangire National Park", link: "/destinations/tarangire", sortOrder: 3 },
      { label: "Lake Manyara", link: "/destinations/manyara", sortOrder: 4 },
      { label: "Lake Natron", link: "/destinations/natron", sortOrder: 5 },
      { label: "Explore More", link: "/destinations", sortOrder: 6 },
    ],
  },
  {
    label: "Blog",
    link: "/blogs",
    itemType: "link",
    sortOrder: 9,
    children: [],
  },
  {
    label: "Contact Us",
    link: "/contact",
    itemType: "link",
    sortOrder: 10,
    children: [],
  },
  {
    label: "Our Tours",
    link: "/packages",
    itemType: "link",
    sortOrder: 11,
    children: [],
  },
];
