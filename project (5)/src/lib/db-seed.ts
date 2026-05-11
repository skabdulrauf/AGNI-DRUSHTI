import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';

const ZONES = [
  // NORTH
  {id: "jim-corbett", name:"Jim Corbett National Park", lat:29.5300, lng:78.7747, state:"Uttarakhand", type: "Tiger Reserve"},
  {id: "rajaji", name:"Rajaji National Park", lat:30.0668, lng:78.1758, state:"Uttarakhand", type: "National Park"},
  {id: "great-himalayan", name:"Great Himalayan National Park", lat:31.7300, lng:77.5100, state:"Himachal Pradesh", type: "World Heritage Site"},
  
  // SOUTH
  {id: "avalahalli", name:"Avalahalli Forest", lat:13.1186, lng:77.5857, state:"Karnataka", type: "State Forest"},
  {id: "bandipur", name:"Bandipur Tiger Reserve", lat:11.6727, lng:76.6343, state:"Karnataka", type: "Tiger Reserve"},
  {id: "nagarhole", name:"Nagarhole National Park", lat:12.0488, lng:76.1318, state:"Karnataka", type: "National Park"},
  {id: "guindy", name:"Guindy National Park", lat:13.0100, lng:80.2200, state:"Tamil Nadu", type: "National Park"},
  {id: "bannerghatta", name:"Bannerghatta Biological Park", lat:12.8000, lng:77.5700, state:"Karnataka", type: "Biological Park"},

  // EAST & NORTH-EAST
  {id: "kaziranga", name:"Kaziranga National Park", lat:26.5775, lng:93.1711, state:"Assam", type: "National Park"},
  {id: "sundarbans", name:"Sundarbans National Park", lat:21.9497, lng:88.9088, state:"West Bengal", type: "Mangrove Forest"},

  // WEST
  {id: "gir", name:"Gir National Park", lat:21.1243, lng:70.8242, state:"Gujarat", type: "National Park"},
  {id: "sanjay-gandhi", name:"Sanjay Gandhi National Park", lat:19.2200, lng:72.9100, state:"Maharashtra", type: "Urban National Park"}
];

export async function seedDatabase() {
  const { firestore: db } = initializeFirebase();
  
  try {
    const zonesSnap = await getDocs(query(collection(db, 'zones'), limit(1)));
    if (zonesSnap.empty) {
      for (const zone of ZONES) {
        await setDoc(doc(db, 'zones', zone.id), zone);
      }
    }
  } catch (e) {
    console.error("Seeding Error:", e);
  }
}
