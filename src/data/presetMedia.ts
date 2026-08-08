import { MediaItem } from '../types';

export const PRESET_MEDIA: MediaItem[] = [
  {
    type: 'mp4',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    title: 'Oceans (Open HD Cinematic)',
    duration: 47,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'Breathtaking ocean documentary footage in high-definition video.'
  },
  {
    type: 'mp4',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    title: 'Sintel (Blender Open Movie)',
    duration: 52,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'Emotional fantasy dragon adventure produced by Blender Studio.'
  },
  {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    title: 'Big Buck Bunny (4K YouTube Stream)',
    duration: 596,
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    description: 'Classic open-source animated comedy short streaming in 4K YouTube.'
  },
  {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=eOrNdBpGMv8',
    title: 'Tears of Steel (4K YouTube Sci-Fi)',
    duration: 734,
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    description: 'VFX open cinematic masterpiece produced by the Blender Foundation.'
  },
  {
    type: 'mp4',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    title: 'Blooming Flower Time-Lapse',
    duration: 5,
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-clear CC0 macro nature video stream.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Chromecast Tech & Fire Showcase',
    duration: 15,
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80',
    description: 'High dynamic range tech video demo stream.'
  }
];

export const CATEGORIES = [
  'All',
  'Movies',
  'Tech & Talks',
  'Anime & Animation',
  'Gaming',
  'Music & Concerts',
  'Personal Uploads'
] as const;
