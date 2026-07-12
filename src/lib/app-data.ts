
import { PlaceHolderImages } from './placeholder-images';

export interface TourismPlace {
  id: string;
  name: string;
  district: string;
  category: 'Wildlife' | 'Temple' | 'Heritage' | 'River' | 'Hill' | 'Tea Garden' | 'Wetland' | 'Museum' | 'Picnic Spot' | 'Eco-Tourism' | 'Infrastructure' | 'Border' | 'Spiritual';
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  featured: boolean;
  popularity_score: number; // 1-100
  search_keywords: string[];
}

const DEFAULT_TOURISM_IMAGE = "https://picsum.photos/seed/assam-general/800/600";
const DEFAULT_FOOD_IMAGE = "https://picsum.photos/seed/assam-food/400/400";
const DEFAULT_FESTIVAL_IMAGE = "https://picsum.photos/seed/assam-festival/600/400";

const getImageUrl = (id: string, fallback: string) => {
  const img = PlaceHolderImages.find(i => i.id === id);
  return img && img.imageUrl ? img.imageUrl : fallback;
};

export const TOURISM_PLACES: TourismPlace[] = [
  {
    id: 'kaziranga-np',
    name: 'Kaziranga National Park',
    district: 'Golaghat',
    category: 'Wildlife',
    description: 'A UNESCO World Heritage site, famous for the great one-horned rhinoceros. It spans across the floodplains of the Brahmaputra river.',
    images: [getImageUrl('kaziranga', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.5775,
    longitude: 93.1703,
    featured: true,
    popularity_score: 98,
    search_keywords: ['rhino', 'safari', 'unesco', 'wildlife']
  },
  {
    id: 'dibru-saikhowa',
    name: 'Dibru-Saikhowa National Park',
    district: 'Tinsukia',
    category: 'Wildlife',
    description: 'A national park and biosphere reserve located in Tinsukia, famous for its feral horses and diverse avian species.',
    images: [getImageUrl('manas', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.6667,
    longitude: 95.3833,
    featured: true,
    popularity_score: 85,
    search_keywords: ['feral horses', 'biosphere', 'riverine']
  },
  {
    id: 'rang-ghar',
    name: 'Rang Ghar',
    district: 'Sivasagar',
    category: 'Heritage',
    description: 'An iconic two-storied royal pavilion used by Ahom kings to watch traditional sports. One of the oldest amphitheaters in Asia.',
    images: [getImageUrl('sivasagar', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9383,
    longitude: 94.6214,
    featured: true,
    popularity_score: 92,
    search_keywords: ['ahom', 'pavilion', 'history', 'monument']
  },
  {
    id: 'majuli-island',
    name: 'Majuli Island',
    district: 'Majuli',
    category: 'Eco-Tourism',
    description: 'The world\'s largest river island and the center of Assamese Neo-Vaishnavite culture. Famous for its Satras and traditional masks.',
    images: [getImageUrl('majuli', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9536,
    longitude: 94.2125,
    featured: true,
    popularity_score: 95,
    search_keywords: ['river island', 'satra', 'culture', 'brahmaputra']
  },
  {
    id: 'digboi-refinery',
    name: 'Digboi Oil Refinery',
    district: 'Tinsukia',
    category: 'Heritage',
    description: 'The oldest operating oil refinery in the world, established in 1901. A testament to Assam\'s early industrial growth.',
    images: [getImageUrl('digboi', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.3822,
    longitude: 95.6315,
    featured: false,
    popularity_score: 80,
    search_keywords: ['oil', 'refinery', 'industrial', 'history']
  },
  {
    id: 'bogibeel-bridge',
    name: 'Bogibeel Bridge',
    district: 'Dibrugarh',
    category: 'Infrastructure',
    description: 'India\'s longest rail-cum-road bridge connecting Dibrugarh and Dhemaji. An engineering marvel over the Brahmaputra.',
    images: [getImageUrl('bogibeel', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.4022,
    longitude: 94.7523,
    featured: false,
    popularity_score: 88,
    search_keywords: ['bridge', 'rail-road', 'engineering', 'dibrugarh']
  },
  {
    id: 'pobitora-wls',
    name: 'Pobitora Wildlife Sanctuary',
    district: 'Morigaon',
    category: 'Wildlife',
    description: 'Holds the highest density of Indian one-horned rhinoceroses in the world. Often called "Mini Kaziranga".',
    images: [getImageUrl('pobitora', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.2413,
    longitude: 92.0520,
    featured: true,
    popularity_score: 90,
    search_keywords: ['rhino', 'safari', 'wildlife', 'mini kaziranga']
  },
  {
    id: 'nameri-np',
    name: 'Nameri National Park',
    district: 'Sonitpur',
    category: 'Wildlife',
    description: 'Famous for its diverse flora and fauna, including the White-winged Wood Duck. Great for rafting on the Jia Bhoreli river.',
    images: [getImageUrl('kaziranga', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9389,
    longitude: 92.8333,
    featured: false,
    popularity_score: 82,
    search_keywords: ['rafting', 'birds', 'jia bhoreli', 'nature']
  },
  {
    id: 'agnigarh-hill',
    name: 'Agnigarh Hill',
    district: 'Sonitpur',
    category: 'Hill',
    description: 'A hill park in Tezpur with a rich mythological history related to the legend of Usha and Aniruddha.',
    images: [getImageUrl('tezpur', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6214,
    longitude: 92.7983,
    featured: false,
    popularity_score: 78,
    search_keywords: ['tezpur', 'mythology', 'viewpoint', 'history']
  },
  {
    id: 'kamakhya-temple',
    name: 'Kamakhya Temple',
    district: 'Kamrup Metro',
    category: 'Temple',
    description: 'A major Hindu pilgrimage site and one of the oldest Shakti Peethas, located on the Nilachal Hill in Guwahati.',
    images: [getImageUrl('kamakhya', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1661,
    longitude: 91.7051,
    featured: true,
    popularity_score: 99,
    search_keywords: ['spiritual', 'shakti', 'guwahati', 'pilgrimage']
  },
  {
    id: 'manas-np',
    name: 'Manas National Park',
    district: 'Baksa',
    category: 'Wildlife',
    description: 'A UNESCO Natural World Heritage site, Project Tiger reserve, and biosphere reserve in the foothills of the Himalayas.',
    images: [getImageUrl('manas', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.7322,
    longitude: 90.9419,
    featured: true,
    popularity_score: 94,
    search_keywords: ['tiger', 'unesco', 'himalayas', 'btr']
  },
  {
    id: 'son-beel',
    name: 'Son Beel',
    district: 'Karimganj',
    category: 'Wetland',
    description: 'The largest wetland in Assam and one of the largest in Asia. It becomes a vast lake in monsoon and a paddy field in winter.',
    images: [getImageUrl('river', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.6333,
    longitude: 92.4500,
    featured: true,
    popularity_score: 85,
    search_keywords: ['wetland', 'lake', 'fishing', 'nature']
  },
  {
    id: 'dihing-patkai-np',
    name: 'Dihing Patkai National Park',
    district: 'Tinsukia',
    category: 'Wildlife',
    description: 'The only rainforest in Assam, often called the "Amazon of the East" due to its dense tropical vegetation and biodiversity.',
    images: [getImageUrl('dihing-patkai', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.2833,
    longitude: 95.4333,
    featured: true,
    popularity_score: 88,
    search_keywords: ['rainforest', 'biodiversity', 'nature', 'amazon of east']
  },
  {
    id: 'talatal-ghar',
    name: 'Talatal Ghar',
    district: 'Sivasagar',
    category: 'Heritage',
    description: 'The largest of all Ahom monuments, this palace served as an army base and features underground tunnels for strategic exits.',
    images: [getImageUrl('talatal-ghar', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9405,
    longitude: 94.6225,
    featured: false,
    popularity_score: 90,
    search_keywords: ['ahom', 'palace', 'history', 'architecture']
  },
  {
    id: 'sivadol-sivasagar',
    name: 'Sivadol',
    district: 'Sivasagar',
    category: 'Temple',
    description: 'The highest Shiva temple in India, part of a trio of temples on the banks of the Joysagar tank.',
    images: [getImageUrl('sivadol', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9856,
    longitude: 94.6405,
    featured: true,
    popularity_score: 91,
    search_keywords: ['spiritual', 'shiva', 'heritage', 'tallest temple']
  },
  {
    id: 'bhupen-hazarika-setu',
    name: 'Bhupen Hazarika Setu',
    district: 'Tinsukia',
    category: 'Infrastructure',
    description: 'Also known as the Dhola-Sadiya Bridge, it is the longest bridge in India over water, connecting Assam and Arunachal Pradesh.',
    images: [getImageUrl('bridge-2', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.7958,
    longitude: 95.6833,
    featured: false,
    popularity_score: 89,
    search_keywords: ['bridge', 'longest bridge', 'engineering', 'sadiya']
  },
  {
    id: 'kakochang-waterfall',
    name: 'Kakochang Waterfall',
    district: 'Golaghat',
    category: 'Picnic Spot',
    description: 'A breathtaking waterfall located near Kaziranga, ideal for trekking and picnics amidst coffee and rubber plantations.',
    images: [getImageUrl('waterfall', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.5413,
    longitude: 93.2105,
    featured: false,
    popularity_score: 75,
    search_keywords: ['waterfall', 'nature', 'trekking', 'picnic']
  },
  {
    id: 'bordowa-than',
    name: 'Bordowa Than',
    district: 'Nagaon',
    category: 'Spiritual',
    description: 'The birthplace of Srimanta Sankardeva, the great social reformer and saint. It is a major center for Neo-Vaishnavite culture.',
    images: [getImageUrl('monastery-2', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.4389,
    longitude: 92.6833,
    featured: true,
    popularity_score: 93,
    search_keywords: ['sankardeva', 'satra', 'culture', 'heritage']
  },
  {
    id: 'umananda-temple',
    name: 'Umananda Temple',
    district: 'Kamrup Metro',
    category: 'Temple',
    description: 'Located on the Peacock Island in the middle of the Brahmaputra, it is one of the smallest inhabited river islands in the world.',
    images: [getImageUrl('river-2', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1956,
    longitude: 91.7451,
    featured: true,
    popularity_score: 94,
    search_keywords: ['river island', 'shiva', 'guwahati', 'ferry']
  },
  {
    id: 'sri-surya-pahar',
    name: 'Sri Surya Pahar',
    district: 'Goalpara',
    category: 'Heritage',
    description: 'An archaeological site showcasing a unique confluence of Hinduism, Buddhism, and Jainism with thousands of rock-cut sculptures.',
    images: [getImageUrl('surya-pahar', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1513,
    longitude: 90.6520,
    featured: false,
    popularity_score: 84,
    search_keywords: ['archaeology', 'sculptures', 'history', 'religions']
  },
  {
    id: 'tocklai-tea-research',
    name: 'Tocklai Tea Research Institute',
    district: 'Jorhat',
    category: 'Tea Garden',
    description: 'The oldest and largest tea research station in the world, playing a pivotal role in the global tea industry.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.7556,
    longitude: 94.2125,
    featured: false,
    popularity_score: 79,
    search_keywords: ['tea research', 'science', 'industry', 'history']
  },
  {
    id: 'hoollongapar-gibbon-wls',
    name: 'Hoollongapar Gibbon Sanctuary',
    district: 'Jorhat',
    category: 'Wildlife',
    description: 'The only sanctuary in India home to the Hoolock Gibbon, the only ape species found in the country.',
    images: [getImageUrl('manas', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6856,
    longitude: 94.3405,
    featured: true,
    popularity_score: 87,
    search_keywords: ['gibbon', 'ape', 'wildlife', 'primates']
  },
  {
    id: 'panbari-mosque',
    name: 'Panbari Mosque',
    district: 'Dhubri',
    category: 'Heritage',
    description: 'The oldest mosque in Assam, built in the 15th-16th century, representing a significant historical and architectural landmark.',
    images: [getImageUrl('panbari', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.0822,
    longitude: 89.9833,
    featured: false,
    popularity_score: 82,
    search_keywords: ['mosque', 'heritage', 'dhubri', 'history']
  },
  {
    id: 'gurdwara-dhubri-sahib',
    name: 'Gurdwara Sri Guru Tegh Bahadur Sahib',
    district: 'Dhubri',
    category: 'Spiritual',
    description: 'A historic Gurdwara established to commemorate the visit of Guru Nanek Dev and Guru Tegh Bahadur to Assam.',
    images: [getImageUrl('gurdwara-dhubri', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.0122,
    longitude: 89.9633,
    featured: true,
    popularity_score: 89,
    search_keywords: ['spiritual', 'gurdwara', 'sikhism', 'dhubri']
  },
  {
    id: 'khaspur-ruins',
    name: 'Khaspur',
    district: 'Cachar',
    category: 'Heritage',
    description: 'The ruins of the capital of the Dimasa Kachari Kingdom, featuring grand gates and palaces in a unique style.',
    images: [getImageUrl('khaspur', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.8833,
    longitude: 92.9333,
    featured: false,
    popularity_score: 80,
    search_keywords: ['dimasa', 'ruins', 'history', 'cachar']
  },
  {
    id: 'bhuban-mahadev',
    name: 'Bhuban Mahadev Temple',
    district: 'Cachar',
    category: 'Temple',
    description: 'A hilltop temple dedicated to Lord Shiva, offering panoramic views of the Barak Valley and the surrounding hills.',
    images: [getImageUrl('bhuban-hills', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.7556,
    longitude: 92.9833,
    featured: true,
    popularity_score: 86,
    search_keywords: ['spiritual', 'shiva', 'hilltop', 'trekking']
  },
  {
    id: 'chakrashila-wls',
    name: 'Chakrashila Wildlife Sanctuary',
    district: 'Kokrajhar',
    category: 'Wildlife',
    description: 'Famous as the second habitat of the Golden Langur in the world. It is a beautiful sanctuary with lakes and hills.',
    images: [getImageUrl('chakrashila', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.2833,
    longitude: 90.3167,
    featured: true,
    popularity_score: 88,
    search_keywords: ['golden langur', 'wildlife', 'kokrajhar', 'nature']
  },
  {
    id: 'bogamati-picnic',
    name: 'Bogamati',
    district: 'Baksa',
    category: 'Picnic Spot',
    description: 'A picturesque spot on the banks of the Bornadi River, known for its scenic beauty and white sand beaches near the Bhutan border.',
    images: [getImageUrl('bogamati', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.8522,
    longitude: 91.5523,
    featured: false,
    popularity_score: 84,
    search_keywords: ['picnic', 'river', 'nature', 'bhutan border']
  },
  {
    id: 'hajo-temples',
    name: 'Hajo',
    district: 'Kamrup Rural',
    category: 'Spiritual',
    description: 'An ancient pilgrimage center for Hindus, Buddhists, and Muslims, representing the religious harmony of Assam.',
    images: [getImageUrl('hajo', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.2422,
    longitude: 91.5233,
    featured: true,
    popularity_score: 92,
    search_keywords: ['spiritual', 'harmony', 'pilgrimage', 'history']
  },
  {
    id: 'madan-kamdev-archaeology',
    name: 'Madan Kamdev',
    district: 'Kamrup Rural',
    category: 'Heritage',
    description: 'Often called the "Khajuraho of Assam", it is an archaeological site with beautiful stone carvings of the 10th-12th century.',
    images: [getImageUrl('madan-kamdev', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.2956,
    longitude: 91.6833,
    featured: false,
    popularity_score: 87,
    search_keywords: ['archaeology', 'carvings', 'history', 'temple ruins']
  },
  {
    id: 'deepor-beel-wetland',
    name: 'Deepor Beel',
    district: 'Kamrup Rural',
    category: 'Wetland',
    description: 'A Ramsar site and one of the largest freshwater lakes in the Brahmaputra valley, known for its diverse migratory birds.',
    images: [getImageUrl('deepor-beel', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1222,
    longitude: 91.6523,
    featured: true,
    popularity_score: 91,
    search_keywords: ['wetland', 'birds', 'ramsar', 'nature']
  },
  {
    id: 'orang-np',
    name: 'Orang National Park',
    district: 'Darrang',
    category: 'Wildlife',
    description: 'Known as "Mini Kaziranga", it is home to the Great Indian One-horned Rhinoceros and is located on the north bank of the Brahmaputra.',
    images: [getImageUrl('orang', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.5622,
    longitude: 92.3315,
    featured: true,
    popularity_score: 90,
    search_keywords: ['rhino', 'safari', 'wildlife', 'mini kaziranga']
  },
  {
    id: 'charaideo-maidams',
    name: 'Charaideo Maidams',
    district: 'Charaideo',
    category: 'Heritage',
    description: 'The burial grounds of the Ahom kings and queens, often referred to as the "Pyramids of Assam". A UNESCO World Heritage site candidate.',
    images: [getImageUrl('charaideo', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9383,
    longitude: 94.8514,
    featured: true,
    popularity_score: 96,
    search_keywords: ['ahom', 'burial', 'pyramids', 'history']
  },
  {
    id: 'mayong-magic',
    name: 'Mayong (Magic Village)',
    district: 'Morigaon',
    category: 'Heritage',
    description: 'Known as the Land of Black Magic, Mayong is famous for its history of sorcery and traditional medicinal practices.',
    images: [getImageUrl('mayong', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.2413,
    longitude: 91.9520,
    featured: false,
    popularity_score: 83,
    search_keywords: ['magic', 'black magic', 'history', 'mythology']
  },
  {
    id: 'kalakshetra-guwahati',
    name: 'Srimanta Sankardev Kalakshetra',
    district: 'Kamrup Metro',
    category: 'Museum',
    description: 'A cultural institution that showcases the artistic excellence and diverse heritage of Assam through museums, theaters, and galleries.',
    images: [getImageUrl('kalakshetra', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1222,
    longitude: 91.8223,
    featured: false,
    popularity_score: 92,
    search_keywords: ['culture', 'museum', 'art', 'heritage']
  },
  {
    id: 'assam-state-zoo',
    name: 'Assam State Zoo',
    district: 'Kamrup Metro',
    category: 'Wildlife',
    description: 'The largest zoo in North East India, featuring a botanical garden and a wide variety of animals including the one-horned rhino.',
    images: [getImageUrl('zoo', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1556,
    longitude: 91.7833,
    featured: false,
    popularity_score: 85,
    search_keywords: ['zoo', 'animals', 'rhino', 'botanical garden']
  },
  {
    id: 'jatinga-bird',
    name: 'Jatinga',
    district: 'Dima Hasao',
    category: 'Hill',
    description: 'A village famous for the mysterious phenomenon of bird "suicide" during certain months, located in the scenic Dima Hasao hills.',
    images: [getImageUrl('jatinga', DEFAULT_TOURISM_IMAGE)],
    latitude: 25.1322,
    longitude: 93.0315,
    featured: true,
    popularity_score: 84,
    search_keywords: ['birds', 'mystery', 'hills', 'nature']
  },
  {
    id: 'digboi-war-cemetery',
    name: 'Digboi War Cemetery',
    district: 'Tinsukia',
    category: 'Heritage',
    description: 'A World War II memorial dedicated to the soldiers who lost their lives in the Burma campaign, maintained by the CWGC.',
    images: [getImageUrl('war-cemetery', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.3922,
    longitude: 95.6415,
    featured: false,
    popularity_score: 78,
    search_keywords: ['war cemetery', 'ww2', 'memorial', 'history']
  },
  {
    id: 'tilinga-mandir-temple',
    name: 'Tilinga Mandir',
    district: 'Tinsukia',
    category: 'Temple',
    description: 'Famous as the "Bell Temple", where thousands of bells of all sizes are tied by devotees to the branches of a giant Banyan tree.',
    images: [getImageUrl('tilinga', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.5222,
    longitude: 95.4523,
    featured: false,
    popularity_score: 86,
    search_keywords: ['spiritual', 'bells', 'temple', 'banyan tree']
  },
  {
    id: 'bhalukpong-river',
    name: 'Bhalukpong',
    district: 'Sonitpur',
    category: 'River',
    description: 'Located on the border of Assam and Arunachal, it is a beautiful spot on the banks of the Jia Bhoreli river, popular for angling.',
    images: [getImageUrl('bhalukpong', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.0122,
    longitude: 92.6533,
    featured: false,
    popularity_score: 81,
    search_keywords: ['river', 'angling', 'border', 'nature']
  },
  {
    id: 'sualkuchi-silk',
    name: 'Sualkuchi',
    district: 'Kamrup Rural',
    category: 'Heritage',
    description: 'The "Manchester of Assam", world-famous for its traditional silk weaving of Muga, Pat, and Eri fabrics.',
    images: [getImageUrl('sualkuchi', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1822,
    longitude: 91.5833,
    featured: true,
    popularity_score: 93,
    search_keywords: ['silk', 'weaving', 'muga', 'crafts']
  },
  {
    id: 'haflong-lake-view',
    name: 'Haflong Lake',
    district: 'Dima Hasao',
    category: 'Hill',
    description: 'A stunning lake in the heart of Haflong town, the only hill station of Assam, offering panoramic views of the surrounding hills.',
    images: [getImageUrl('haflong', DEFAULT_TOURISM_IMAGE)],
    latitude: 25.1722,
    longitude: 93.0233,
    featured: true,
    popularity_score: 90,
    search_keywords: ['lake', 'hill station', 'haflong', 'scenic']
  },
  {
    id: 'navagraha-temple',
    name: 'Navagraha Temple',
    district: 'Kamrup Metro',
    category: 'Temple',
    description: 'The Temple of the Nine Celestial Bodies, located on the Chitrachal Hill in Guwahati. An ancient center of astronomical study.',
    images: [getImageUrl('navagraha', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1913,
    longitude: 91.7615,
    featured: false,
    popularity_score: 88,
    search_keywords: ['spiritual', 'astronomy', 'ancient', 'planets']
  },
  {
    id: 'basistha-ashram',
    name: 'Basistha Ashram',
    district: 'Kamrup Metro',
    category: 'Spiritual',
    description: 'An ancient ashram dedicated to Maharishi Basistha, located at the edge of the Garbhanga forest with beautiful streams.',
    images: [getImageUrl('basistha', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1013,
    longitude: 91.7820,
    featured: false,
    popularity_score: 87,
    search_keywords: ['spiritual', 'nature', 'ashram', 'waterfall']
  },
  {
    id: 'mahabhairab-temple',
    name: 'Mahabhairab Temple',
    district: 'Sonitpur',
    category: 'Temple',
    description: 'An ancient Shiva temple in Tezpur built by King Bana. It houses one of the largest stone Shiva Lingams in the world.',
    images: [getImageUrl('mahabhairab', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6322,
    longitude: 92.7933,
    featured: true,
    popularity_score: 92,
    search_keywords: ['shiva', 'spiritual', 'ancient', 'tezpur']
  },
  {
    id: 'kareng-ghar-palace',
    name: 'Kareng Ghar',
    district: 'Sivasagar',
    category: 'Heritage',
    description: 'The seven-storied Ahom royal palace at Garhgaon, showcasing unique multi-level brick architecture and historical grandeur.',
    images: [getImageUrl('kareng-ghar', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9313,
    longitude: 94.7520,
    featured: true,
    popularity_score: 94,
    search_keywords: ['ahom', 'palace', 'history', 'architecture']
  },
  {
    id: 'bornadi-wls',
    name: 'Bornadi Wildlife Sanctuary',
    district: 'Baksa',
    category: 'Wildlife',
    description: 'Located in the foothills of the Bhutan Himalayas, it is famous for the Pygmy Hog and the Hispid Hare.',
    images: [getImageUrl('bornadi', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.7822,
    longitude: 91.7515,
    featured: false,
    popularity_score: 85,
    search_keywords: ['pygmy hog', 'wildlife', 'nature', 'himalayas']
  },
  {
    id: 'doomdooma-tea-gardens',
    name: 'Doomdooma Tea Gardens',
    district: 'Tinsukia',
    category: 'Tea Garden',
    description: 'One of the most prolific tea-producing regions in the world, offering vast vistas of lush green tea estates.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.5622,
    longitude: 95.5533,
    featured: false,
    popularity_score: 82,
    search_keywords: ['tea', 'plantation', 'nature', 'industrial']
  },
  {
    id: 'margherita-mines',
    name: 'Margherita Coal Mines',
    district: 'Tinsukia',
    category: 'Heritage',
    description: 'Known for its historic coal mines established during the British era. The Coal Museum showcases the industrial history of the region.',
    images: [getImageUrl('margherita', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.2822,
    longitude: 95.6815,
    featured: false,
    popularity_score: 80,
    search_keywords: ['coal', 'mining', 'history', 'museum']
  },
  {
    id: 'namphake-monastery',
    name: 'Namphake Buddhist Monastery',
    district: 'Tinsukia',
    category: 'Spiritual',
    description: 'A beautiful Tai-Phake Buddhist monastery, known for its serene atmosphere and traditional Tai-Phake culture and architecture.',
    images: [getImageUrl('namphake', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.3122,
    longitude: 95.3833,
    featured: true,
    popularity_score: 89,
    search_keywords: ['buddhism', 'tai-phake', 'spiritual', 'culture']
  },
  {
    id: 'jokai-botanical',
    name: 'Jokai Botanical Garden',
    district: 'Dibrugarh',
    category: 'Eco-Tourism',
    description: 'A lush green area near Dibrugarh featuring a wide variety of flora, medicinal plants, and walking trails.',
    images: [getImageUrl('zoo', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.4222,
    longitude: 94.8815,
    featured: false,
    popularity_score: 79,
    search_keywords: ['nature', 'plants', 'walking', 'eco-friendly']
  },
  {
    id: 'biswanath-ghat-river',
    name: 'Biswanath Ghat',
    district: 'Biswanath',
    category: 'Heritage',
    description: 'Often called the "Gupta Kashi", it is home to ancient temples and a beautiful riverfront on the Brahmaputra.',
    images: [getImageUrl('biswanath-ghat', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6522,
    longitude: 93.1515,
    featured: true,
    popularity_score: 91,
    search_keywords: ['spiritual', 'riverfront', 'ancient', 'heritage']
  },
  {
    id: 'laokhowa-wls',
    name: 'Laokhowa Wildlife Sanctuary',
    district: 'Nagaon',
    category: 'Wildlife',
    description: 'Part of the Kaziranga-Orang riverine ecosystem, it is home to the Great Indian One-horned Rhinoceros and Wild Buffalo.',
    images: [getImageUrl('laokhowa', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.4822,
    longitude: 92.7515,
    featured: false,
    popularity_score: 83,
    search_keywords: ['rhino', 'buffalo', 'nature', 'wildlife']
  },
  {
    id: 'silghat-heritage',
    name: 'Silghat',
    district: 'Nagaon',
    category: 'Heritage',
    description: 'A river port and historical site on the Brahmaputra, known for its ancient temples and as a key point in Assam\'s history.',
    images: [getImageUrl('river', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6122,
    longitude: 92.9333,
    featured: false,
    popularity_score: 78,
    search_keywords: ['river port', 'heritage', 'temple', 'nagaon']
  },
  {
    id: 'champawati-kunda',
    name: 'Champawati Kunda',
    district: 'Nagaon',
    category: 'Picnic Spot',
    description: 'A beautiful waterfall located near Chaparmukh, popular for its scenic surroundings and as a serene picnic spot.',
    images: [getImageUrl('waterfall', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.1522,
    longitude: 92.5523,
    featured: false,
    popularity_score: 74,
    search_keywords: ['waterfall', 'picnic', 'nature', 'nagaon']
  },
  {
    id: 'chandubi-lake-eco',
    name: 'Chandubi Lake',
    district: 'Kamrup Rural',
    category: 'Eco-Tourism',
    description: 'A natural lake formed by an earthquake in 1897, offering a peaceful environment for boating and bird watching.',
    images: [getImageUrl('chandubi', DEFAULT_TOURISM_IMAGE)],
    latitude: 25.8822,
    longitude: 91.4333,
    featured: true,
    popularity_score: 87,
    search_keywords: ['lake', 'nature', 'boating', 'birds']
  },
  {
    id: 'maniharan-tunnel',
    name: 'Maniharan Tunnel',
    district: 'Cachar',
    category: 'Spiritual',
    description: 'A historic tunnel associated with the legend of Lord Krishna, located near Bhuvan Hills, Silchar.',
    images: [getImageUrl('khaspur', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.7556,
    longitude: 92.9633,
    featured: false,
    popularity_score: 79,
    search_keywords: ['krishna', 'history', 'tunnel', 'mythology']
  },
  {
    id: 'badarpur-fort',
    name: 'Badarpur Fort',
    district: 'Cachar',
    category: 'Heritage',
    description: 'A Mughal-era fort on the banks of the Barak River, representing the strategic importance of the region in ancient times.',
    images: [getImageUrl('khaspur', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.8922,
    longitude: 92.6115,
    featured: false,
    popularity_score: 81,
    search_keywords: ['fort', 'mughal', 'history', 'riverbank']
  },
  {
    id: 'barpeta-satra-heritage',
    name: 'Barpeta Satra',
    district: 'Barpeta',
    category: 'Heritage',
    description: 'A prominent Vaishnavite monastery established by Madhabdeva, a key center for the Neo-Vaishnavite movement and culture.',
    images: [getImageUrl('barpeta-satra', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.3122,
    longitude: 91.0115,
    featured: true,
    popularity_score: 95,
    search_keywords: ['satra', 'culture', 'vaishnavite', 'heritage']
  },
  {
    id: 'sutarkandi-border-gate',
    name: 'Sutarkandi Border',
    district: 'Karimganj',
    category: 'Border',
    description: 'An international trade center and border point between India and Bangladesh, known for its strategic and economic importance.',
    images: [getImageUrl('sutarkandi', DEFAULT_TOURISM_IMAGE)],
    latitude: 24.8522,
    longitude: 92.2115,
    featured: false,
    popularity_score: 76,
    search_keywords: ['border', 'trade', 'bangladesh', 'karimganj']
  },
  {
    id: 'ultapani-forest',
    name: 'Ultapani Forest Reserve',
    district: 'Kokrajhar',
    category: 'Wildlife',
    description: 'A lush forest corridor famous for the Golden Langur and as a diverse habitat for butterflies and birds.',
    images: [getImageUrl('chakrashila', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.7522,
    longitude: 90.2833,
    featured: true,
    popularity_score: 85,
    search_keywords: ['golden langur', 'butterflies', 'nature', 'btr']
  },
  {
    id: 'kalia-bhomora-bridge',
    name: 'Kalia Bhomora Setu',
    district: 'Sonitpur',
    category: 'Infrastructure',
    description: 'A massive bridge across the Brahmaputra river connecting Tezpur and Nagaon, named after the Ahom general Kalia Bhomora Phukan.',
    images: [getImageUrl('bridge-2', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.5833,
    longitude: 92.8515,
    featured: false,
    popularity_score: 88,
    search_keywords: ['bridge', 'engineering', 'tezpur', 'river']
  },
  // NEW 20 PLACES
  {
    id: 'pengeri-forest',
    name: 'Pengeri Forest Reserve',
    district: 'Tinsukia',
    category: 'Wildlife',
    description: 'A dense forest reserve in Tinsukia district, known for its rich biodiversity and scenic forest trails.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 27.3522,
    longitude: 95.5833,
    featured: false,
    popularity_score: 72,
    search_keywords: ['forest', 'nature', 'tinsukia', 'wildlife']
  },
  {
    id: 'barbaruah-maidam',
    name: 'Barbaruah Maidam',
    district: 'Dibrugarh',
    category: 'Heritage',
    description: 'Ancient burial mounds of the Ahom nobility, representing the historical significance of Dibrugarh in the Ahom era.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 27.4222,
    longitude: 94.8833,
    featured: false,
    popularity_score: 68,
    search_keywords: ['ahom', 'burial', 'history', 'dibrugarh']
  },
  {
    id: 'dehing-satra',
    name: 'Dehing Satra',
    district: 'Dibrugarh',
    category: 'Spiritual',
    description: 'A historical Vaishnavite monastery located on the banks of the Dehing river, significant for its cultural heritage.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 27.3522,
    longitude: 94.7833,
    featured: false,
    popularity_score: 75,
    search_keywords: ['satra', 'spiritual', 'dibrugarh', 'culture']
  },
  {
    id: 'maijan-tea',
    name: 'Maijan Tea Estate',
    district: 'Dibrugarh',
    category: 'Tea Garden',
    description: 'A beautiful tea estate near Dibrugarh, offering insight into the heritage of tea production in Assam.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 27.5022,
    longitude: 94.9523,
    featured: false,
    popularity_score: 77,
    search_keywords: ['tea garden', 'plantation', 'dibrugarh', 'nature']
  },
  {
    id: 'namdang-bridge',
    name: 'Namdang Stone Bridge',
    district: 'Sivasagar',
    category: 'Infrastructure',
    description: 'A historic bridge carved out of a single solid piece of rock in 1703 by the Ahom King Rudra Singha.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9122,
    longitude: 94.5833,
    featured: true,
    popularity_score: 86,
    search_keywords: ['ahom', 'stone bridge', 'history', 'engineering']
  },
  {
    id: 'vishnu-dol',
    name: 'Vishnu Dol',
    district: 'Sivasagar',
    category: 'Temple',
    description: 'Part of the Sivasagar temple complex, this temple is dedicated to Lord Vishnu and reflects Ahom architectural style.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9856,
    longitude: 94.6405,
    featured: false,
    popularity_score: 82,
    search_keywords: ['temple', 'vishnu', 'ahom', 'sivasagar']
  },
  {
    id: 'devi-dol',
    name: 'Devi Dol',
    district: 'Sivasagar',
    category: 'Temple',
    description: 'Dedicated to Goddess Durga, this temple is one of the three iconic temples situated on the banks of Sivasagar tank.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9856,
    longitude: 94.6405,
    featured: false,
    popularity_score: 81,
    search_keywords: ['temple', 'durga', 'ahom', 'sivasagar']
  },
  {
    id: 'joysagar-tank',
    name: 'Joysagar Tank',
    district: 'Sivasagar',
    category: 'Heritage',
    description: 'One of the largest man-made tanks in India, built by King Rudra Singha in memory of his mother Joymoti.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9722,
    longitude: 94.6315,
    featured: true,
    popularity_score: 90,
    search_keywords: ['ahom', 'tank', 'history', 'sivasagar']
  },
  {
    id: 'gaurisagar-tank',
    name: 'Gaurisagar Tank',
    district: 'Sivasagar',
    category: 'Heritage',
    description: 'A historical tank built by the Ahom Queen Phuleswari, surrounded by several ancient temples.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 27.0122,
    longitude: 94.7523,
    featured: false,
    popularity_score: 83,
    search_keywords: ['ahom', 'tank', 'history', 'queen phuleswari']
  },
  {
    id: 'kamalabari-satra',
    name: 'Kamalabari Satra',
    district: 'Majuli',
    category: 'Spiritual',
    description: 'A prominent center of art, culture, and literature in Majuli, famous for its classical dances and devotional music.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9622,
    longitude: 94.2233,
    featured: true,
    popularity_score: 92,
    search_keywords: ['majuli', 'satra', 'culture', 'art']
  },
  {
    id: 'auniati-satra',
    name: 'Auniati Satra',
    district: 'Majuli',
    category: 'Spiritual',
    description: 'Established in 1653, it is known for its collection of ancient Assamese artifacts and traditional "Paal Naam" prayer.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9522,
    longitude: 94.1833,
    featured: true,
    popularity_score: 91,
    search_keywords: ['majuli', 'satra', 'history', 'artifacts']
  },
  {
    id: 'dakhinpat-satra',
    name: 'Dakhinpat Satra',
    district: 'Majuli',
    category: 'Spiritual',
    description: 'A major Satra of Majuli, known for its Raas Leela celebration and traditional Assamese architecture.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9422,
    longitude: 94.2833,
    featured: false,
    popularity_score: 88,
    search_keywords: ['majuli', 'satra', 'raas leela', 'culture']
  },
  {
    id: 'garmur-satra',
    name: 'Garmur Satra',
    district: 'Majuli',
    category: 'Spiritual',
    description: 'A prominent religious institution in Majuli, significant for its role in the Neo-Vaishnavite movement and cultural preservation.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.9722,
    longitude: 94.2523,
    featured: false,
    popularity_score: 87,
    search_keywords: ['majuli', 'satra', 'spiritual', 'heritage']
  },
  {
    id: 'lachit-maidam',
    name: 'Lachit Borphukan Maidam',
    district: 'Jorhat',
    category: 'Heritage',
    description: 'The final resting place of the legendary Ahom General Lachit Borphukan, who defeated the Mughals in the Battle of Saraighat.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.7122,
    longitude: 94.1833,
    featured: true,
    popularity_score: 89,
    search_keywords: ['ahom', 'lachit borphukan', 'history', 'memorial']
  },
  {
    id: 'jorhat-gymkhana',
    name: 'Jorhat Gymkhana Club',
    district: 'Jorhat',
    category: 'Heritage',
    description: 'Established in 1876, it is the oldest golf course in Asia and the third oldest in the world.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.7522,
    longitude: 94.2115,
    featured: false,
    popularity_score: 82,
    search_keywords: ['golf', 'british era', 'history', 'club']
  },
  {
    id: 'cinnamora-tea',
    name: 'Cinnamora Tea Estate',
    district: 'Jorhat',
    category: 'Tea Garden',
    description: 'The first tea garden in Assam, established by Maniram Dewan, the first Assamese tea planter.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.7222,
    longitude: 94.2333,
    featured: true,
    popularity_score: 85,
    search_keywords: ['tea history', 'maniram dewan', 'plantation', 'jorhat']
  },
  {
    id: 'negheriting-shiva',
    name: 'Negheriting Shiva Doul',
    district: 'Golaghat',
    category: 'Temple',
    description: 'An ancient Shiva temple situated on a small hillock, known for its beautiful architecture and large population of monkeys.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.6833,
    longitude: 94.0122,
    featured: false,
    popularity_score: 84,
    search_keywords: ['shiva', 'spiritual', 'hillock', 'architecture']
  },
  {
    id: 'numaligarh-tea',
    name: 'Numaligarh Tea Estate',
    district: 'Golaghat',
    category: 'Tea Garden',
    description: 'A sprawling tea estate in Golaghat district, known for its high-quality tea and scenic landscapes.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.6122,
    longitude: 93.7523,
    featured: false,
    popularity_score: 79,
    search_keywords: ['tea', 'plantation', 'nature', 'golaghat']
  },
  {
    id: 'nambor-wls',
    name: 'Nambor Wildlife Sanctuary',
    district: 'Golaghat',
    category: 'Wildlife',
    description: 'A sanctuary in the Karbi Anglong and Golaghat districts, home to diverse flora and fauna including wild elephants.',
    images: [DEFAULT_TOURISM_IMAGE],
    latitude: 26.4122,
    longitude: 93.8833,
    featured: false,
    popularity_score: 78,
    search_keywords: ['wildlife', 'nature', 'elephants', 'golaghat']
  },
  {
    id: 'sonari-tea',
    name: 'Sonari Tea Gardens',
    district: 'Charaideo',
    category: 'Tea Garden',
    description: 'Lush green tea gardens in Charaideo district, representing the vast tea industry of Upper Assam.',
    images: [getImageUrl('assam-tea', DEFAULT_TOURISM_IMAGE)],
    latitude: 26.9833,
    longitude: 94.8833,
    featured: false,
    popularity_score: 76,
    search_keywords: ['tea', 'plantation', 'charaideo', 'nature']
  }
];

export const DISTRICTS = [
  'All', 'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 
  'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup Metro', 'Kamrup Rural', 
  'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 
  'Sonitpur', 'South Salmara', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'
];

export const CATEGORIES = [
  'All', 'Wildlife', 'Temple', 'Heritage', 'River', 'Hill', 'Tea Garden', 'Wetland', 'Museum', 'Picnic Spot', 'Eco-Tourism', 'Infrastructure', 'Border', 'Spiritual'
];

export const FOOD = [
  {
    id: 1,
    name: 'Masor Tenga',
    description: 'A signature Assamese sour fish curry. It is light and tangy, typically prepared with outenga (elephant apple), tomatoes, or lemon.',
    image: getImageUrl('masor-tenga', DEFAULT_FOOD_IMAGE),
    type: 'Main Course'
  },
  {
    id: 2,
    name: 'Pork with Bamboo Shoot',
    description: 'A classic tribal delicacy. The smoky flavor of pork is perfectly balanced by the sharp, earthy aroma of fermented bamboo shoot.',
    image: getImageUrl('pork-bamboo', DEFAULT_FOOD_IMAGE),
    type: 'Non-Veg'
  },
  {
    id: 3,
    name: 'Assam Tea',
    description: 'World-renowned black tea grown at sea level. Known for its body, briskness, malty flavor, and strong, bright color.',
    image: getImageUrl('assam-tea', DEFAULT_FOOD_IMAGE),
    type: 'Beverage'
  },
  {
    id: 4,
    name: 'Pithas',
    description: 'Traditional rice cakes essential to Bihu. Varieties include Til Pitha (sesame), Ghila Pitha (fried), and Sunga Pitha (bamboo-roasted).',
    image: getImageUrl('pithas', DEFAULT_FOOD_IMAGE),
    type: 'Snack'
  },
  {
    id: 5,
    name: 'Khar',
    description: 'A unique dish made by filtering water through the ashes of sun-dried banana peels (Kola Khar), cooked with raw papaya or pulses.',
    image: 'https://picsum.photos/seed/khar/400/400',
    type: 'Starter'
  },
  {
    id: 6,
    name: 'Paro Mangxo',
    description: 'Pigeon meat cooked with banana flower (Koldil). A traditional delicacy often served on special occasions and winters.',
    image: 'https://picsum.photos/seed/pigeon/400/400',
    type: 'Delicacy'
  },
  {
    id: 7,
    name: 'Duck with Ash Gourd',
    description: 'Hanh-kumura. A rich, flavorful curry where duck meat is slow-cooked with white gourd and local spices.',
    image: 'https://picsum.photos/seed/duck/400/400',
    type: 'Main Course'
  },
  {
    id: 8,
    name: 'Jolpan',
    description: 'A traditional breakfast consisting of various forms of rice like Kumol Saul, Chira, Muri, served with curd and jaggery.',
    image: 'https://picsum.photos/seed/jolpan/400/400',
    type: 'Breakfast'
  }
];

export const FESTIVALS = [
  {
    id: 1,
    name: 'Rongali Bihu',
    month: 'April',
    description: 'The Assamese New Year. Celebrated with energetic Bihu dance, music, and traditional delicacies to mark the arrival of spring.',
    image: getImageUrl('bihu', DEFAULT_FESTIVAL_IMAGE)
  },
  {
    id: 2,
    name: 'Ambubachi Mela',
    month: 'June',
    description: 'Known as the Mahakumbh of the East, it is held at Kamakhya Temple and celebrates the Earth\'s fertility.',
    image: getImageUrl('ambubachi', DEFAULT_FESTIVAL_IMAGE)
  },
  {
    id: 3,
    name: 'Bhogali Bihu',
    month: 'January',
    description: 'The harvest festival. Characterized by community feasts, building of Mejis (bonfires), and traditional sports.',
    image: 'https://picsum.photos/seed/bhogali/600/400'
  },
  {
    id: 4,
    name: 'Ali-Aye-Ligang',
    month: 'February',
    description: 'The spring festival of the Mising tribe, marking the beginning of the sowing season with the "Gumrag" dance.',
    image: 'https://picsum.photos/seed/mising/600/400'
  },
  {
    id: 5,
    name: 'Baishagu',
    month: 'April',
    description: 'The Bodo tribe\'s New Year festival, famous for the Bagurumba dance and colorful traditional attire.',
    image: 'https://picsum.photos/seed/bodo/600/400'
  },
  {
    id: 6,
    name: 'Me-Dam-Me-Phi',
    month: 'January',
    description: 'An ancestor-worship festival of the Ahom community, where offerings are made to the spirits of the forefathers.',
    image: 'https://picsum.photos/seed/ahom/600/400'
  }
];

export const TRAVEL_TIPS = [
  { title: 'Transport', content: 'Auto-rickshaws and Ola/Uber are common in cities. For long distances, trains and buses are reliable.', icon: 'bus' },
  { title: 'Weather', content: 'Avoid July to September due to heavy monsoon floods. Best time is October to April.', icon: 'sun' },
  { title: 'Language', content: 'Assamese is the main language. Hindi and English are widely understood in urban areas.', icon: 'languages' },
  { title: 'Health', content: 'Drink bottled water. Carry mosquito repellent, especially when visiting wildlife parks.', icon: 'heart' },
  { title: 'Connectivity', content: 'Jio and Airtel have good coverage. Rural areas like Majuli may have weak signals.', icon: 'wifi' }
];

export const EMERGENCY = [
  { label: 'Police', number: '100', icon: 'shield' },
  { label: 'Ambulance', number: '108', icon: 'ambulance' },
  { label: 'Fire', number: '101', icon: 'flame' },
  { label: 'Tourism Dept', number: '0361-2633654', icon: 'info' },
  { label: 'Women Helpline', number: '181', icon: 'user' }
];
