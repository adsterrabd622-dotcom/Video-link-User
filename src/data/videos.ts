export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  description: string;
  videoUrl: string;
  likes?: number;
  views?: number;
  createdAt?: string | number | any;
}

export const videos: Video[] = [
  {
    id: "1",
    title: "Beautiful Nature Highlights",
    thumbnail: "https://picsum.photos/seed/nature3/640/360",
    duration: "10:05",
    description: "A stunning collection of natural landscapes.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    id: "2",
    title: "Urban Architecture",
    thumbnail: "https://picsum.photos/seed/urban/640/360",
    duration: "08:20",
    description: "Exploring modern city design.",
    videoUrl: "https://www.w3schools.com/html/movie.mp4"
  },
  {
    id: "3",
    title: "Culinary Arts",
    thumbnail: "https://picsum.photos/seed/food/640/360",
    duration: "12:15",
    description: "Mastering the art of gourmet cooking.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  }
];
