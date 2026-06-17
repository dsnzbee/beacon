const delhiLocations = [
  {
    name: "North Delhi",
    documentFolder: "north-delhi",
    pincodes: ["110007", "110009", "110033", "110034"],
    suggestedPlaces: ["Pitampura", "Rohini", "Shalimar Bagh"],
  },
  {
    name: "South Delhi",
    documentFolder: "south-delhi",
    pincodes: ["110016", "110017", "110024", "110030"],
    suggestedPlaces: ["Hauz Khas", "Saket", "Lajpat Nagar"],
  },
  {
    name: "Central Delhi",
    documentFolder: "central-delhi",
    pincodes: ["110001", "110002", "110005", "110055"],
    suggestedPlaces: ["Connaught Place", "Karol Bagh", "Daryaganj"],
  },
  {
    name: "East Delhi",
    documentFolder: "east-delhi",
    pincodes: ["110031", "110032", "110091", "110092"],
    suggestedPlaces: ["Preet Vihar", "Mayur Vihar", "Laxmi Nagar"],
  },
  {
    name: "West Delhi",
    documentFolder: "west-delhi",
    pincodes: ["110015", "110018", "110027", "110058"],
    suggestedPlaces: ["Rajouri Garden", "Janakpuri", "Tilak Nagar"],
  },
];

export function findLocationByPincode(pincode) {
  return delhiLocations.find((location) => location.pincodes.includes(pincode));
}

export default delhiLocations;
