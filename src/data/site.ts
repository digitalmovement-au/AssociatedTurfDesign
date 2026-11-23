export const UPLOADS = ((import.meta.env.PUBLIC_UPLOADS_BASE as string | undefined) ?? "https://associatedturf.com.au/wp-content/uploads").replace(/\/$/, "");

/** Resolve a WordPress uploads path ("2024/10/foo.jpg" or "U/2024/10/foo.jpg") or pass through absolute / root paths. */
export const img = (p?: string) => {
  if (!p) return "";
  if (/^(https?:)?\/\//.test(p)) return p;
  if (p.startsWith("/wp-content/uploads/")) return `${UPLOADS}/${p.slice(20)}`;
  if (p.startsWith("/")) return p;
  return `${UPLOADS}/${p.replace(/^U\//, "")}`;
};

export const business = {
  name: "Associated Turf",
  legalName: "Associated Turf Supplies",
  phone: "1800 044 006",
  phoneHref: "tel:1800044006",
  email: "info@associatedturf.com.au",
  street: "Cornwallis Road",
  locality: "Windsor",
  region: "NSW",
  postcode: "2756",
  address: "Cornwallis Road, Windsor NSW 2756",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Associated+Turf+Cornwallis+Road+Windsor+NSW",
  reviewsUrl: "https://www.google.com/search?q=Associated+Turf+Windsor+NSW+reviews",
  hours: [
    { days: "Monday to Friday", time: "8am to 4.30pm" },
    { days: "Saturday", time: "7am to 12pm" },
    { days: "Sunday", time: "Closed" },
  ],
  topline: "Farm fresh turf delivered across Sydney and Regional NSW",
  url: "https://associatedturf.com.au",
  logo: "2019/05/associated-turf-logo.png",
  geo: { lat: -33.5935, lng: 150.8158 },
  social: [
    { name: "Facebook", href: "https://www.facebook.com/Associated-Turf/", icon: "facebook" },
    { name: "Instagram", href: "https://www.instagram.com/associatedturf/", icon: "instagram" },
    { name: "YouTube", href: "https://www.youtube.com/channel/UClzAkd4-Gyo1GORIMa2OdLw", icon: "youtube" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/associated-turf/", icon: "linkedin" },
    { name: "X", href: "https://twitter.com/AssociatedTurf", icon: "x" },
  ],
};

export type Rating = { label: string; text: string; score: number };

export interface Variety {
  slug: string;
  name: string;
  short: string;
  family: "Buffalo" | "Kikuyu" | "Couch";
  href: string;
  supplierHref?: string;
  image: string;
  tag: string;
  teaser: string;
  sun: string;
  texture: string;
  ratings: Rating[];
}

const r = (label: string, text: string) => {
  const t = text.toLowerCase();
  const score = t.startsWith("excellent") ? 5 : t.startsWith("very good") ? 4.5 : t.startsWith("very fast") ? 5 : t.startsWith("good") ? 4 : t.startsWith("fast") ? 4 : t.startsWith("moderate") ? 3 : t.startsWith("slow–moderate") ? 2.5 : t.startsWith("fair") ? 2 : t.startsWith("slow") ? 2 : t.startsWith("low") ? 5 : t.startsWith("high") ? 2 : 1;
  return { label, text, score };
};

/** Figures from the live comparison table on /turf-varieties/. For maintenance, "Low" scores highest (least work). */
export const varieties: Variety[] = [
  {
    slug: "matilda", name: "Matilda Soft Leaf Buffalo", short: "Matilda", family: "Buffalo",
    href: "/matilda-soft-leaf-buffalo-turf/", supplierHref: "/matilda-turf-soft-leaf-buffalo-grass-supplier/",
    image: "2023/02/gal2023-7.jpg", tag: "Voted #1 by landscapers",
    teaser: "A lush, resilient lawn with excellent durability and water efficiency. Ideal for busy households.",
    sun: "3 to 4 hours of direct sun", texture: "Soft, fine, dense",
    ratings: [r("Shade", "Excellent"), r("Drought", "Excellent"), r("Wear", "Very Good"), r("Easy care", "Low"), r("Frost", "Good")],
  },
  {
    slug: "sir-walter", name: "Sir Walter Soft Leaf Buffalo", short: "Sir Walter", family: "Buffalo",
    href: "/sir-walter-soft-leaf-buffalo-grass/", supplierHref: "/sir-walter-soft-leaf-buffalo-supplier/",
    image: "2024/03/sir-walter-1.jpg", tag: "Family favourite",
    teaser: "Australia's most popular buffalo. Soft underfoot, drought tolerant and outstanding in shade.",
    sun: "3 to 4 hours of direct sun", texture: "Soft, broad, lush",
    ratings: [r("Shade", "Excellent"), r("Drought", "Excellent"), r("Wear", "Very Good"), r("Easy care", "Low"), r("Frost", "Good")],
  },
  {
    slug: "kikuyu", name: "Kikuyu Turf Grass", short: "Kikuyu", family: "Kikuyu",
    href: "/kikuyu-grass-sydney/", supplierHref: "/kikuyu-turf-grass-supplier/",
    image: "2026/10/kikuyu-associated-turf-1024x768.jpg", tag: "Hard wearing",
    teaser: "Fast growing and tough. Perfect for high traffic areas, acreage, schools and sporting fields.",
    sun: "Full sun", texture: "Medium-coarse",
    ratings: [r("Shade", "Poor"), r("Drought", "Very Good"), r("Wear", "Excellent"), r("Easy care", "High"), r("Frost", "Moderate")],
  },
  {
    slug: "greenlees-park", name: "Greenlees Park Couch", short: "Greenlees Park", family: "Couch",
    href: "/greenlees-park-couch-grass/", supplierHref: "/greenlees-park-couch-grass-supplier/",
    image: "2023/02/gal2023-2.jpg", tag: "Sports grade",
    teaser: "Premium appearance and durability for sporting fields, commercial landscapes and prestige homes.",
    sun: "Full sun", texture: "Medium",
    ratings: [r("Shade", "Poor"), r("Drought", "Moderate"), r("Wear", "Very Good"), r("Easy care", "Moderate"), r("Frost", "Moderate")],
  },
  {
    slug: "wintergreen", name: "Wintergreen Couch", short: "Wintergreen", family: "Couch",
    href: "/wintergreen-couch-grass/", supplierHref: "/wintergreen-couch-grass-supplier/",
    image: "2024/03/wintergreen-3.jpg", tag: "Fine leaf finish",
    teaser: "A fine, dense lawn with vibrant colour. A popular choice for golf style landscapes and sunny yards.",
    sun: "Full sun", texture: "Fine",
    ratings: [r("Shade", "Poor"), r("Drought", "Moderate"), r("Wear", "Good"), r("Easy care", "Moderate"), r("Frost", "Moderate")],
  },
  {
    slug: "shademaster", name: "Shademaster Soft Leaf Buffalo", short: "Shademaster", family: "Buffalo",
    href: "/shademaster-soft-leaf-buffalo-turf/",
    image: "2018/07/shademaster.jpg", tag: "85% shade tolerant",
    teaser: "A thick, spongy, dark green buffalo that thrives in shade and full sun. Gentle on children.",
    sun: "4 to 5 hours of direct sun", texture: "Broad, soft",
    ratings: [r("Shade", "Very Good"), r("Drought", "Good"), r("Wear", "Fair"), r("Easy care", "Low"), r("Frost", "Fair")],
  },
];

export const varietyByPath = (path: string) => varieties.find((v) => v.href === path || v.supplierHref === path);

export const stats = [
  { value: 45, suffix: "+", label: "Years supplying Sydney" },
  { value: 6, suffix: "", label: "Premium turf varieties" },
  { value: 6, suffix: "", label: "Delivery days every week" },
  { value: 35, suffix: "+", label: "Areas serviced across NSW" },
];

export const whyUs = [
  { icon: "award", title: "45+ years of experience", body: "Generations of Sydney lawns grown with proven know how." },
  { icon: "scissors", title: "Harvested fresh to order", body: "Cut on demand so your turf arrives vibrant and healthy." },
  { icon: "sun", title: "Grown for Sydney's climate", body: "Premium varieties suited to local soils and seasons." },
  { icon: "tag", title: "Competitive pricing", body: "Farm direct supply for exceptional value on every order." },
  { icon: "truck", title: "Reliable delivery", body: "On time delivery across Sydney, Monday to Saturday." },
  { icon: "chat", title: "Friendly expert advice", body: "Honest guidance on varieties, preparation and laying." },
];

export const steps = [
  { title: "Choose your turf", body: "Compare varieties or ask our team to recommend the best fit for your yard." },
  { title: "Request a quote", body: "Send your measurements and receive a fast, obligation free quote." },
  { title: "We harvest fresh", body: "Your turf is cut to order on our farm for peak health and colour." },
  { title: "Delivered and laid", body: "We deliver on time, with optional Maxi Turf laying service." },
];

/** Two testimonials published on the live residential page. */
export const testimonials = [
  { quote: "Our backyard has never looked better! The turf was delivered on time, and the team gave excellent advice.", name: "Sarah M.", place: "North Shore" },
  { quote: "Professional service and top-quality turf. Our new lawn is the envy of the street!", name: "James L.", place: "Inner West" },
];

export const nav = [
  { label: "Home", href: "/" },
  {
    label: "Turf Varieties", href: "/turf-varieties/",
    children: [
      { label: "Turf Overview", href: "/turf-varieties/" },
      ...varieties.map((v) => ({ label: v.name, href: v.href })),
    ],
  },
  {
    label: "Services", href: "/turf-supply/",
    children: [
      { label: "Turf Supply", href: "/turf-supply/" },
      { label: "Turf Delivery", href: "/turf-delivery/" },
      { label: "Turf Laying", href: "/turf-laying/" },
      { label: "Turf Installation", href: "/turf-installation/" },
      { label: "Supply and Install", href: "/turf-supply-and-install/" },
      { label: "Maxi Turf Laying Service", href: "/maxi-turf-laying-service/" },
      { label: "Commercial Turf Supply", href: "/commercial-turf-supply/" },
    ],
  },
  {
    label: "Turf Care", href: "/turf-care/",
    children: [
      { label: "Turf Preparation", href: "/turf-preparation/" },
      { label: "Turf Care", href: "/turf-care/" },
      { label: "Watering", href: "/watering/" },
      { label: "Common Insects and Weeds", href: "/turf-insects-weeds/" },
    ],
  },
  { label: "Gallery", href: "/turf-gallery/" },
  { label: "News", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

export const footerCols = [
  {
    title: "Turf Varieties",
    links: [{ label: "Compare All Varieties", href: "/turf-varieties/" }, ...varieties.map((v) => ({ label: v.name, href: v.href }))],
  },
  {
    title: "Services",
    links: [
      { label: "Turf Supply", href: "/turf-supply/" },
      { label: "Turf Delivery", href: "/turf-delivery/" },
      { label: "Turf Laying Service", href: "/turf-laying-service/" },
      { label: "Turf Installation", href: "/turf-installation/" },
      { label: "Supply and Install", href: "/turf-supply-and-install/" },
      { label: "Commercial Turf", href: "/commercial-turf-solutions/" },
      { label: "Turf Farms", href: "/turf-farms/" },
    ],
  },
  {
    title: "Lawn Advice",
    links: [
      { label: "Turf Preparation", href: "/turf-preparation/" },
      { label: "Turf Care", href: "/turf-care/" },
      { label: "Watering", href: "/watering/" },
      { label: "Insects and Weeds", href: "/turf-insects-weeds/" },
      { label: "News and Tips", href: "/blog/" },
      { label: "Areas We Deliver", href: "/turf-supplies/" },
      { label: "Gallery", href: "/turf-gallery/" },
    ],
  },
];
