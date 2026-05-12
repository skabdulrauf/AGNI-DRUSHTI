import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';

const ZONES = [
  // NORTH INDIA
  {id: "jim-corbett", name:"Jim Corbett Tiger Reserve", lat:29.5300, lng:78.7747, state:"Uttarakhand", type: "Tiger Reserve"},
  {id: "rajaji", name:"Rajaji National Park", lat:30.0668, lng:78.1758, state:"Uttarakhand", type: "National Park"},
  {id: "great-himalayan", name:"Great Himalayan National Park", lat:31.7300, lng:77.5100, state:"Himachal Pradesh", type: "National Park"},
  {id: "hemis", name:"Hemis National Park", lat:33.9100, lng:77.4000, state:"Ladakh", type: "National Park"},
  {id: "valley-of-flowers", name:"Valley of Flowers National Park", lat:30.7200, lng:79.6000, state:"Uttarakhand", type: "National Park"},
  {id: "dudhwa", name:"Dudhwa National Park", lat:28.4800, lng:80.5800, state:"Uttar Pradesh", type: "Tiger Reserve"},
  {id: "sariska", name:"Sariska Tiger Reserve", lat:27.3200, lng:76.4300, state:"Rajasthan", type: "Tiger Reserve"},
  {id: "ranthambore", name:"Ranthambore Tiger Reserve", lat:26.0100, lng:76.5000, state:"Rajasthan", type: "Tiger Reserve"},
  {id: "keoladeo", name:"Keoladeo National Park", lat:27.1600, lng:77.5200, state:"Rajasthan", type: "National Park"},
  {id: "kalesar", name:"Kalesar National Park", lat:30.3300, lng:77.5800, state:"Haryana", type: "National Park"},
  {id: "daachigam", name:"Dachigam National Park", lat:34.1300, lng:74.9300, state:"Jammu & Kashmir", type: "National Park"},
  {id: "harike", name:"Harike Wetland & Forest", lat:31.1700, lng:74.9500, state:"Punjab", type: "Wildlife Sanctuary"},
  {id: "valmiki", name:"Valmiki Tiger Reserve", lat:27.3500, lng:84.2000, state:"Bihar", type: "Tiger Reserve"},

  // CENTRAL INDIA
  {id: "kanha", name:"Kanha Tiger Reserve", lat:22.3300, lng:80.6000, state:"Madhya Pradesh", type: "Tiger Reserve"},
  {id: "bandhavgarh", name:"Bandhavgarh Tiger Reserve", lat:23.7000, lng:81.0200, state:"Madhya Pradesh", type: "Tiger Reserve"},
  {id: "pench-mp", name:"Pench Tiger Reserve (MP)", lat:21.6800, lng:79.2100, state:"Madhya Pradesh", type: "Tiger Reserve"},
  {id: "panna", name:"Panna Tiger Reserve", lat:24.5800, lng:80.0500, state:"Madhya Pradesh", type: "Tiger Reserve"},
  {id: "satpura", name:"Satpura Tiger Reserve", lat:22.4500, lng:78.1500, state:"Madhya Pradesh", type: "Tiger Reserve"},
  {id: "indravati", name:"Indravati National Park", lat:19.1000, lng:80.4500, state:"Chhattisgarh", type: "Tiger Reserve"},
  {id: "palamau", name:"Palamau Tiger Reserve", lat:23.7200, lng:84.0500, state:"Jharkhand", type: "Tiger Reserve"},

  // SOUTH INDIA
  {id: "avalahalli", name:"Avalahalli State Forest", lat:13.1186, lng:77.5857, state:"Karnataka", type: "State Forest"},
  {id: "bandipur", name:"Bandipur Tiger Reserve", lat:11.6727, lng:76.6343, state:"Karnataka", type: "Tiger Reserve"},
  {id: "nagarhole", name:"Nagarhole Tiger Reserve", lat:12.0488, lng:76.1318, state:"Karnataka", type: "Tiger Reserve"},
  {id: "bannerghatta", name:"Bannerghatta Biological Park", lat:12.8000, lng:77.5700, state:"Karnataka", type: "National Park"},
  {id: "mudumalai", name:"Mudumalai Tiger Reserve", lat:11.5800, lng:76.6000, state:"Tamil Nadu", type: "Tiger Reserve"},
  {id: "periyar", name:"Periyar Tiger Reserve", lat:9.4600, lng:77.2400, state:"Kerala", type: "Tiger Reserve"},
  {id: "silent-valley", name:"Silent Valley National Park", lat:11.1300, lng:76.4300, state:"Kerala", type: "National Park"},
  {id: "nagarjunsagar", name:"Nagarjunsagar-Srisailam Tiger Reserve", lat:16.1200, lng:78.8500, state:"Andhra Pradesh", type: "Tiger Reserve"},
  {id: "kawal", name:"Kawal Tiger Reserve", lat:19.1500, lng:78.8000, state:"Telangana", type: "Tiger Reserve"},

  // WEST INDIA
  {id: "gir", name:"Gir National Park & Sanctuary", lat:21.1243, lng:70.8242, state:"Gujarat", type: "National Park"},
  {id: "tadoba", name:"Tadoba Andhari Tiger Reserve", lat:20.2000, lng:79.3500, state:"Maharashtra", type: "Tiger Reserve"},
  {id: "sanjay-gandhi", name:"Sanjay Gandhi National Park", lat:19.2200, lng:72.9100, state:"Maharashtra", type: "National Park"},
  {id: "mollem", name:"Mollem National Park", lat:15.3500, lng:74.2000, state:"Goa", type: "National Park"},

  // EAST & NORTH-EAST INDIA
  {id: "sundarbans", name:"Sundarbans Tiger Reserve", lat:21.9497, lng:88.9088, state:"West Bengal", type: "Tiger Reserve"},
  {id: "simlipal", name:"Simlipal Tiger Reserve", lat:21.9200, lng:86.4000, state:"Odisha", type: "Tiger Reserve"},
  {id: "kaziranga", name:"Kaziranga Tiger Reserve", lat:26.5775, lng:93.1711, state:"Assam", type: "Tiger Reserve"},
  {id: "namdapha", name:"Namdapha National Park", lat:27.4800, lng:96.3800, state:"Arunachal Pradesh", type: "Tiger Reserve"},
  {id: "keibul-lamjao", name:"Keibul Lamjao National Park", lat:24.5800, lng:93.8500, state:"Manipur", type: "National Park"},
  {id: "nokrek", name:"Nokrek National Park", lat:25.4800, lng:90.3200, state:"Meghalaya", type: "Biosphere Reserve"},
  {id: "intanki", name:"Intanki National Park", lat:25.5800, lng:93.4500, state:"Nagaland", type: "National Park"},
  {id: "khangchendzonga", name:"Khangchendzonga National Park", lat:27.6500, lng:88.2500, state:"Sikkim", type: "National Park"},
  {id: "dampa", name:"Dampa Tiger Reserve", lat:23.7000, lng:92.4000, state:"Mizoram", type: "Tiger Reserve"},
  {id: "clouded-leopard", name:"Clouded Leopard National Park", lat:23.8500, lng:91.3000, state:"Tripura", type: "National Park"}
];

export async function seedDatabase() {
  const { firestore: db } = initializeFirebase();
  
  try {
    for (const zone of ZONES) {
      await setDoc(doc(db, 'zones', zone.id), zone, { merge: true });
    }
    console.log(`[AGNI-DRISHTI] National Grid Synchronized: ${ZONES.length} forest nodes online.`);
  } catch (e) {
    console.error("Seeding Error:", e);
  }
}