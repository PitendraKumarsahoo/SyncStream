import { MediaItem } from '../types';

export const PRESET_MEDIA: MediaItem[] = [
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    title: 'Tears of Steel (4K Open Sci-Fi Film)',
    duration: 734,
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    description: 'VFX open cinematic masterpiece produced by the Blender Foundation.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny (1080p Animation)',
    duration: 596,
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    description: 'Classic open-source animated comedy short starring Big Buck.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'Elephants Dream (Classic Open Movie)',
    duration: 653,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    description: 'Surreal machine-world open animation film.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    title: 'Sintel (Fantasy Drama Short)',
    duration: 888,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'Emotional fantasy dragon adventure produced by Blender Studio.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Chromecast Tech & Fire Showcase',
    duration: 15,
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80',
    description: 'High dynamic range tech video demo stream.'
  },
  {
    type: 'mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2013.mp4',
    title: 'Mountain Road Scenic Drive 4K',
    duration: 59,
    posterUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    description: 'Scenic automobile journey across breathtaking mountain roads.'
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
