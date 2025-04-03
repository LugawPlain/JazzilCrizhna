export interface CategoryData {
  title: string;
  image: string;
  category: string;
  link: string;
  photographer: string;
}

export const categories: CategoryData[] = [
  {
    title: "Pageant",
    image: "/pageant.jpg",
    category: "PAGEANT",
    link: "/portfolio/pageant",
    photographer: "📸 Troy Sarinas",
  },
  {
    title: "Modeling",
    image: "/model.jpg",
    category: "MODELING",
    link: "/portfolio/modeling",
    photographer: "📸 ",
  },
  {
    title: "Advertising",
    image: "/advertising.jpg",
    category: "ADVERTISING",
    link: "/portfolio/advertising",
    photographer: "📸 Allan Mendoza",
  },
  {
    title: "Clothing",
    image: "/clothing.jpg",
    category: "CLOTHING",
    link: "/portfolio/clothing",
    photographer: "📸 ",
  },
  {
    title: "Muse",
    image: "/muse.jpg",
    category: "MUSE",
    link: "/portfolio/muse",
    photographer: "📸 Troy Sarinas ",
  },
  {
    title: "Photoshoot",
    image: "/photoshoot.jpg",
    category: "PHOTOSHOOTS",
    link: "/portfolio/photoshoot",
    photographer: "📸 ",
  },
  {
    title: "Cosplay",
    image: "/cosplay.jpg",
    category: "COSPLAY",
    link: "/portfolio/cosplay",
    photographer: "📸 Robert Bardon",
  },
];
