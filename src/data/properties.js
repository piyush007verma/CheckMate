import { DUMMY_PROPERTIES } from './dummyListings.js'

// Demo data. Shape mirrors the Supabase `properties` table so we can swap sources later.
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`

const I = {
  apt1: 'photo-1522708323590-d24dbb6b0267', liv1: 'photo-1502672260266-1c1ef2d93688',
  apt2: 'photo-1560448204-e02f11c3d0e2', apt3: 'photo-1493809842364-78817add7ffb',
  kit1: 'photo-1556909114-f6e7ad7d3136', kit2: 'photo-1484154218962-a197022b5858',
  bed1: 'photo-1505691938895-1758d7feb511', bed2: 'photo-1540518614846-7eded433c457',
  house1: 'photo-1568605114967-8130f3a36994', house2: 'photo-1564013799919-ab600027ffc6',
  house3: 'photo-1580587771525-78b9dba3b914', house4: 'photo-1600585154340-be6161a56a0c',
  liv2: 'photo-1554995207-c18c203602cb', bed3: 'photo-1536376072261-38c75010e6c9',
  bed4: 'photo-1555854877-bab0e564b8d5', bed5: 'photo-1631049307264-da0ec9d70304',
}
const imgs = (...keys) => keys.map((k) => img(I[k]))

export const CATEGORIES = [
  { value: 'student', label: 'Students' },
  { value: 'professional', label: 'Professionals' },
  { value: 'family', label: 'Families' },
  { value: 'individual', label: 'Individuals' },
]
export const PROPERTY_TYPES = ['PG', 'Hostel', 'Shared Room', 'Private Room', 'Studio', 'Apartment', 'Co-living', 'House']
export const FURNISHING = ['Furnished', 'Semi-furnished', 'Unfurnished']
export const AMENITIES = ['WiFi', 'AC', 'Parking', 'Power backup', 'Washing machine', 'Meals included', 'Gym', 'Security', 'Lift', 'Geyser', 'Study desk', 'Balcony']
export const MAX_RENT = 60000

export const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v

export const DEMO_OWNER_ID = 'demo-owner-1'

const CORE_DEMO = [
  { id: 'p1', owner_id: DEMO_OWNER_ID, title: 'Sunrise PG for Girls', description: 'A calm, well-lit PG five minutes from the Phase 7 market. Home-cooked meals twice a day, weekly housekeeping and a quiet study hall. Gate closes at 10:30 pm.', category: 'student', property_type: 'PG', city: 'Mohali', locality: 'Phase 7', latitude: 30.7046, longitude: 76.7179, monthly_rent: 7500, security_deposit: 7500, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'Meals included', 'Geyser', 'Study desk', 'Security', 'Power backup'], images: imgs('bed1', 'liv2', 'kit1'), available: true, created_at: '2026-10-20T09:00:00Z' },
  { id: 'p2', owner_id: DEMO_OWNER_ID, title: 'Scholars Hostel, Sector 35', description: 'Twin-sharing hostel rooms close to the university bus route. Common reading room, mess with a monthly menu and 24x7 security.', category: 'student', property_type: 'Hostel', city: 'Chandigarh', locality: 'Sector 35', latitude: 30.727, longitude: 76.759, monthly_rent: 5500, security_deposit: 5000, bedrooms: 1, bathrooms: 1, furnishing: 'Semi-furnished', amenities: ['WiFi', 'Meals included', 'Security', 'Study desk', 'Washing machine'], images: imgs('bed2', 'bed3', 'liv1'), available: true, created_at: '2026-10-18T09:00:00Z' },
  { id: 'p3', owner_id: DEMO_OWNER_ID, title: 'Shared Triple Room near Forum Mall', description: 'Bright triple-sharing room with individual cupboards and desks, a short walk from Koramangala cafes and the bus stand.', category: 'student', property_type: 'Shared Room', city: 'Bengaluru', locality: 'Koramangala', latitude: 12.9352, longitude: 77.6245, monthly_rent: 8500, security_deposit: 8500, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Washing machine', 'Geyser', 'Study desk'], images: imgs('bed4', 'apt1', 'kit2'), available: true, created_at: '2026-10-15T09:00:00Z' },
  { id: 'p4', owner_id: DEMO_OWNER_ID, title: 'Furnished 2BHK Co-Living, Indiranagar', description: 'Two private bedrooms with a shared lounge and fully equipped kitchen. Fast fibre internet, a housekeeper twice a week and a metro station within walking distance.', category: 'professional', property_type: 'Co-living', city: 'Bengaluru', locality: 'Indiranagar', latitude: 12.9784, longitude: 77.6408, monthly_rent: 18000, security_deposit: 36000, bedrooms: 2, bathrooms: 2, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Washing machine', 'Gym', 'Security', 'Lift', 'Power backup'], images: imgs('apt3', 'liv1', 'bed5', 'kit1'), available: true, created_at: '2026-10-25T09:00:00Z' },
  { id: 'p5', owner_id: DEMO_OWNER_ID, title: 'Modern 1BHK near the IT Park', description: 'A modern one-bedroom flat with a balcony in Viman Nagar, ten minutes from the IT park. Covered parking and a gated society with a gym.', category: 'professional', property_type: 'Apartment', city: 'Pune', locality: 'Viman Nagar', latitude: 18.5679, longitude: 73.9143, monthly_rent: 22000, security_deposit: 44000, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Parking', 'Gym', 'Lift', 'Balcony', 'Security'], images: imgs('apt2', 'kit2', 'bed2'), available: true, created_at: '2026-10-27T09:00:00Z' },
  { id: 'p6', owner_id: DEMO_OWNER_ID, title: 'Light-filled Studio, Sector 70', description: 'A self-contained studio with a kitchenette and work corner. Quiet lane, near the Sector 70 market. Ideal for one person.', category: 'individual', property_type: 'Studio', city: 'Mohali', locality: 'Sector 70', latitude: 30.687, longitude: 76.723, monthly_rent: 14000, security_deposit: 28000, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Geyser', 'Power backup', 'Balcony'], images: imgs('apt1', 'bed1', 'kit1'), available: true, created_at: '2026-10-22T09:00:00Z' },
  { id: 'p7', owner_id: DEMO_OWNER_ID, title: 'Spacious 3BHK Family Home', description: 'A ground-plus-one family home with a lawn and two-car parking, in a leafy residential sector close to schools and a hospital.', category: 'family', property_type: 'House', city: 'Chandigarh', locality: 'Sector 22', latitude: 30.7333, longitude: 76.7794, monthly_rent: 45000, security_deposit: 90000, bedrooms: 3, bathrooms: 3, furnishing: 'Semi-furnished', amenities: ['Parking', 'Power backup', 'Geyser', 'Security', 'Balcony'], images: imgs('house1', 'liv2', 'kit2', 'bed3'), available: true, created_at: '2026-10-12T09:00:00Z' },
  { id: 'p8', owner_id: DEMO_OWNER_ID, title: 'Garden Villa in Kothrud', description: 'A bright three-bedroom villa with a private garden, in a quiet Kothrud lane. Walking distance to a park and good schools.', category: 'family', property_type: 'House', city: 'Pune', locality: 'Kothrud', latitude: 18.5074, longitude: 73.8077, monthly_rent: 38000, security_deposit: 76000, bedrooms: 3, bathrooms: 3, furnishing: 'Semi-furnished', amenities: ['Parking', 'Security', 'Washing machine', 'Balcony', 'Power backup'], images: imgs('house2', 'house4', 'kit1', 'bed2'), available: true, created_at: '2026-10-08T09:00:00Z' },
  { id: 'p9', owner_id: DEMO_OWNER_ID, title: 'Private Room with Balcony, HSR', description: 'A private room in a friendly three-bedroom flat with an attached bathroom and a balcony. Shared kitchen and living room.', category: 'individual', property_type: 'Private Room', city: 'Bengaluru', locality: 'HSR Layout', latitude: 12.9116, longitude: 77.6474, monthly_rent: 12000, security_deposit: 24000, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Balcony', 'Washing machine', 'Geyser'], images: imgs('bed5', 'apt3', 'kit2'), available: true, created_at: '2026-10-19T09:00:00Z' },
  { id: 'p10', owner_id: DEMO_OWNER_ID, title: '2BHK Apartment on VIP Road', description: 'An unfurnished two-bedroom apartment in a gated society with a clubhouse. Ideal for a small family; close to schools and highway access.', category: 'family', property_type: 'Apartment', city: 'Zirakpur', locality: 'VIP Road', latitude: 30.6425, longitude: 76.8173, monthly_rent: 19000, security_deposit: 38000, bedrooms: 2, bathrooms: 2, furnishing: 'Unfurnished', amenities: ['Parking', 'Lift', 'Security', 'Power backup', 'Gym'], images: imgs('apt2', 'liv2', 'house3'), available: true, created_at: '2026-10-05T09:00:00Z' },
  { id: 'p11', owner_id: DEMO_OWNER_ID, title: 'Executive Co-Living Suites', description: 'Single-occupancy suites with a shared work lounge and rooftop. Meals available, weekly cleaning and flexible monthly terms.', category: 'professional', property_type: 'Co-living', city: 'Chandigarh', locality: 'Sector 34', latitude: 30.72, longitude: 76.766, monthly_rent: 16500, security_deposit: 33000, bedrooms: 1, bathrooms: 1, furnishing: 'Furnished', amenities: ['WiFi', 'AC', 'Meals included', 'Gym', 'Lift', 'Security', 'Washing machine'], images: imgs('bed3', 'apt1', 'liv1'), available: true, created_at: '2026-10-23T09:00:00Z' },
  { id: 'p12', owner_id: DEMO_OWNER_ID, title: 'Budget PG for Boys, Shivajinagar', description: 'Double-sharing rooms with meals, close to colleges and the bus hub. Simple, clean and well run.', category: 'student', property_type: 'PG', city: 'Pune', locality: 'Shivajinagar', latitude: 18.5308, longitude: 73.8475, monthly_rent: 6500, security_deposit: 6500, bedrooms: 1, bathrooms: 1, furnishing: 'Semi-furnished', amenities: ['WiFi', 'Meals included', 'Geyser', 'Study desk', 'Washing machine'], images: imgs('bed4', 'bed1', 'kit2'), available: false, created_at: '2026-10-01T09:00:00Z' },
]

// Sample listings: the 12 hand-written ones first (the home hero uses them), then ~90 generated Punjab/Haryana listings.
export const DEMO_PROPERTIES = [...CORE_DEMO, ...DUMMY_PROPERTIES]

// True for built-in sample listings (not user-created ones).
export const isSampleListing = (p) => DEMO_PROPERTIES.some((d) => d.id === p.id)

// Approximate city centres, used as default map coordinates for new listings.
export const CITY_COORDS = {
  Patiala: [30.3398, 76.3869],
  Rajpura: [30.4841, 76.5941],
  Chandigarh: [30.7333, 76.7794],
  Mohali: [30.7046, 76.7179],
  Zirakpur: [30.6425, 76.8173],
  Panchkula: [30.6942, 76.8606],
  Phagwara: [31.224, 75.7708],
  Ambala: [30.3782, 76.7767],
  Kurukshetra: [29.9695, 76.8783],
  Karnal: [29.6857, 76.9905],
  Rohtak: [28.8955, 76.6066],
  Gurugram: [28.4595, 77.0266],
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
}
