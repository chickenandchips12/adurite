// Sample marketplace items (based on real Adurite listings)
const MARKETPLACE_ITEMS = [
  { name: "Purple Queen of the Night", rap: 270000, price: 1521 },
  { name: "Blue Queen of the Night", rap: 180000, price: 842 },
  { name: "Scissors", rap: 160000, price: 688 },
  { name: "Playful Vampire", rap: 115000, price: 482 },
  { name: "Blizzard Beast Mode", rap: 100000, price: 444 },
  { name: "Radioactive Beast Mode", rap: 75000, price: 303 },
  { name: "Supa Dupa Fly Cap", rap: 60000, price: 256 },
  { name: "Snowflake Eyes", rap: 26000, price: 102 },
  { name: "Helsworn Valkyrie", rap: 22000, price: 90 },
  { name: "Black Iron Antlers", rap: 20000, price: 80 },
  { name: "Emerald Valkyrie", rap: 7500000, price: 50000 },
  { name: "White Sparkle Time Fedora", rap: 6300000, price: 31800 },
  { name: "Sparkle Time Valkyrie", rap: 6200000, price: 42082 },
  { name: "Dominus Rex", rap: 5000000, price: 29998 },
  { name: "Red Void Star", rap: 5000000, price: 42400 },
  { name: "New Years Crown 2012", rap: 4000000, price: 24380 },
  { name: "The Void Star", rap: 3200000, price: 11395 },
  { name: "Sparkle Time Fedora", rap: 3000000, price: 16960 },
  { name: "Eyes of Emeraldwrath", rap: 2200000, price: 8989 },
  { name: "Frozen Horns of the Frigid Planes", rap: 1900000, price: 7750 },
  { name: "Dominus Vespertilio", rap: 1800000, price: 7419 },
  { name: "Subarctic Commando", rap: 1800000, price: 7420 },
  { name: "Poisoned Horns of the Toxic Wasteland", rap: 1400000, price: 5075 },
  { name: "Firebrand", rap: 1200000, price: 15052 },
  { name: "SFOTH IV Crown of Fire", rap: 1100000, price: 10000 },
  { name: "Dark Horns of Pwnage", rap: 1100000, price: 4770 },
  { name: "Clockwork's Headphones", rap: 1000000, price: 6148 },
  { name: "Dominus Praefectus", rap: 930000, price: 3149 },
  { name: "Telamon's Chicken Suit", rap: 690000, price: 2332 },
  { name: "Brighteyes' Cola Hat", rap: 670000, price: 2841 },
  { name: "Goldlika: Hero", rap: 620000, price: 3391 },
  { name: "Emo King", rap: 600000, price: 3998 },
  { name: "Viscount of the Federation", rap: 590000, price: 3689 },
  { name: "Yum!", rap: 560000, price: 3604 },
  { name: "Silver King of the Night", rap: 540000, price: 2220 },
  { name: "Pink Queen of the Night", rap: 520000, price: 2359 },
  { name: "The Classic Fedora", rap: 510000, price: 1960 },
  { name: "Purple Ice Crown", rap: 500000, price: 2650 },
  { name: "Mr. Hatbot", rap: 494000, price: 1343 },
  { name: "Sword of Darkness", rap: 490000, price: 2228 },
  { name: "Ice Valkyrie", rap: 490000, price: 2046 },
  { name: "Twin Kodachi", rap: 470000, price: 1685 },
  { name: "Green Ice Crown", rap: 440000, price: 2756 },
  { name: "Agonizingly Violet Bucket of Cheer", rap: 430000, price: 3180 },
  { name: "Gold King of the Night", rap: 430000, price: 2341 },
  { name: "Black Iron Bucket of Ultimate Pwnage", rap: 400000, price: 1696 },
  { name: "Golden Antlers", rap: 390000, price: 2014 },
  { name: "Rubywrath Dragon", rap: 350000, price: 2120 },
];

// Format RAP for display (e.g., 270000 -> "270K", 7500000 -> "7.5M")
function formatRap(rap) {
  if (rap >= 1000000) {
    return (rap / 1000000).toFixed(rap % 1000000 === 0 ? 0 : 1) + "M";
  }
  if (rap >= 1000) {
    return (rap / 1000).toFixed(rap % 1000 === 0 ? 0 : 1) + "K";
  }
  return rap.toString();
}

// Format price for display
function formatPrice(price) {
  return "$" + price.toLocaleString();
}
