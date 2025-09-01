import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Utility to create test films with publicationStatus: 'public'
 * This will solve the "No Public Films Available" issue
 */

export interface TestFilmData {
  titleEn: string;
  titleTh?: string;
  director: string;
  synopsis: string;
  releaseYear: number;
  duration: number;
  country: string;
  language: string[];
  genres: string[];
  publicationStatus: 'public';
  status: 'published';
  featured?: boolean;
}

const testFilms: TestFilmData[] = [
  {
    titleEn: "The Last Sunset",
    titleTh: "พระอาทิตย์ตกดวงสุดท้าย",
    director: "Somchai Jaidee",
    synopsis: "A poignant drama about a family's final moments together as they watch the last sunset from their ancestral home before it's demolished for urban development.",
    releaseYear: 2024,
    duration: 105,
    country: "Thailand",
    language: ["Thai", "English"],
    genres: ["Drama", "Family"],
    publicationStatus: 'public',
    status: 'published',
    featured: true
  },
  {
    titleEn: "Neon Dreams",
    titleTh: "ความฝันสีนีออน",
    director: "Apinya Sakuljaroensuk",
    synopsis: "A cyberpunk thriller set in futuristic Bangkok, following a young hacker who discovers a conspiracy that threatens the digital world.",
    releaseYear: 2024,
    duration: 118,
    country: "Thailand",
    language: ["Thai"],
    genres: ["Thriller", "Sci-Fi"],
    publicationStatus: 'public',
    status: 'published',
    featured: false
  },
  {
    titleEn: "Rice Field Memories",
    titleTh: "ความทรงจำในทุ่งนา",
    director: "Weerasak Muangsuwan",
    synopsis: "A heartwarming story about three generations of rice farmers and their connection to the land that has sustained their family for decades.",
    releaseYear: 2023,
    duration: 95,
    country: "Thailand",
    language: ["Thai", "Isaan"],
    genres: ["Drama", "Documentary"],
    publicationStatus: 'public',
    status: 'published',
    featured: true
  },
  {
    titleEn: "The Silent Orchestra",
