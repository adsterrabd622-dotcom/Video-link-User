import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const mockVideos = [
  {
    id: "vid_01",
    title: "The Silent Echo",
    thumbnail: "https://picsum.photos/seed/echo/1920/1080?blur=2",
    duration: "14:20",
    description: "Discover the untold secrets of the forgotten valley.",
    videoUrl: "https://example.com/target-video-1"
  },
  {
    id: "vid_02",
    title: "Neon Nights",
    thumbnail: "https://picsum.photos/seed/neon/1920/1080?blur=2",
    duration: "08:45",
    description: "A cyberpunk journey through the undercity.",
    videoUrl: "https://example.com/target-video-2"
  },
  {
    id: "vid_03",
    title: "Ocean's Whisper",
    thumbnail: "https://picsum.photos/seed/ocean/1920/1080?blur=2",
    duration: "22:15",
    description: "Deep sea exploration like never seen before.",
    videoUrl: "https://example.com/target-video-3"
  },
  {
    id: "vid_04",
    title: "Velocity Extreme",
    thumbnail: "https://picsum.photos/seed/velocity/1920/1080?blur=2",
    duration: "05:30",
    description: "High-octane racing compilation of the decade.",
    videoUrl: "https://example.com/target-video-4"
  }
];

async function seed() {
  const vidsCol = collection(db, 'videos');
  const snap = await getDocs(vidsCol);
  
  if (snap.empty) {
    console.log("Seeding initial videos...");
    for (const v of mockVideos) {
      await setDoc(doc(vidsCol, v.id), v);
    }
    console.log("Seeding complete.");
  } else {
    console.log("Videos collection already has data.");
  }
  process.exit(0);
}

seed().catch(console.error);
