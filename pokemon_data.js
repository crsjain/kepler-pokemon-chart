// Curated Pokémon Data for Badges

export const POKEMON_MAP = {
  // Tier 1
  1: "Bulbasaur", 2: "Ivysaur", 3: "Venusaur",
  4: "Charmander", 5: "Charmeleon", 6: "Charizard",
  7: "Squirtle", 8: "Wartortle", 9: "Blastoise",
  12: "Butterfree",
  25: "Pikachu", 26: "Raichu",
  35: "Clefairy",
  37: "Vulpix", 38: "Ninetales",
  39: "Jigglypuff", 40: "Wigglytuff",
  52: "Meowth", 53: "Persian",
  54: "Psyduck", 55: "Golduck",
  58: "Growlithe", 59: "Arcanine",
  63: "Abra", 65: "Alakazam",
  66: "Machop", 68: "Machamp",
  79: "Slowpoke", 80: "Slowbro",
  94: "Gengar", 95: "Onix",
  130: "Gyarados", 131: "Lapras",
  133: "Eevee", 134: "Vaporeon", 135: "Jolteon", 136: "Flareon",
  143: "Snorlax",
  149: "Dragonite", 150: "Mewtwo", 151: "Mew",
  152: "Chikorita", 153: "Bayleef", 154: "Meganium",
  155: "Cyndaquil", 156: "Quilava", 157: "Typhlosion",
  158: "Totodile", 159: "Croconaw", 160: "Feraligatr",
  172: "Pichu",
  175: "Togepi", 176: "Togetic",
  179: "Mareep", 180: "Flaaffy", 181: "Ampharos",
  194: "Wooper",
  196: "Espeon", 197: "Umbreon",
  212: "Scizor", 214: "Heracross",
  228: "Houndour", 229: "Houndoom",
  246: "Larvitar", 247: "Pupitar", 248: "Tyranitar",
  249: "Lugia", 250: "Ho-Oh", 251: "Celebi",
  252: "Treecko", 253: "Grovyle", 254: "Sceptile",
  255: "Torchic", 256: "Combusken", 257: "Blaziken",
  258: "Mudkip", 259: "Marshtomp", 260: "Swampert",
  282: "Gardevoir", 303: "Mawile", 330: "Flygon",
  359: "Absol", 376: "Metagross",
  380: "Latias", 381: "Latios", 382: "Kyogre", 383: "Groudon", 384: "Rayquaza", 385: "Jirachi", 386: "Deoxys",
  387: "Turtwig", 388: "Grotle", 389: "Torterra",
  390: "Chimchar", 391: "Monferno", 392: "Infernape",
  393: "Piplup", 394: "Prinplup", 395: "Empoleon",
  447: "Riolu", 448: "Lucario",
  470: "Leafeon", 471: "Glaceon",
  483: "Dialga", 484: "Palkia", 487: "Giratina", 493: "Arceus",

  // Tier 2
  403: "Shinx", 404: "Luxio", 405: "Luxray",
  443: "Gible", 444: "Gabite", 445: "Garchomp",
  475: "Gallade",
  494: "Victini",
  495: "Snivy", 496: "Servine", 497: "Serperior",
  498: "Tepig", 499: "Pignite", 500: "Emboar",
  501: "Oshawott", 502: "Dewott", 503: "Samurott",
  610: "Axew", 611: "Fraxure", 612: "Haxorus",
  633: "Deino", 634: "Zweilous", 635: "Hydreigon",
  637: "Volcarona",
  643: "Reshiram", 644: "Zekrom", 646: "Kyurem",
  649: "Genesect",
  653: "Fennekin", 654: "Braixen", 655: "Delphox",
  656: "Froakie", 657: "Frogadier", 658: "Greninja",
  681: "Aegislash",
  700: "Sylveon",
  704: "Goomy", 705: "Sliggoo", 706: "Goodra",
  716: "Xerneas", 717: "Yveltal", 718: "Zygarde",
  719: "Diancie", 720: "Hoopa",
  722: "Rowlet", 723: "Dartrix", 724: "Decidueye",
  725: "Litten", 726: "Torracat", 727: "Incineroar",
  736: "Grubbin", 738: "Vikavolt",
  744: "Rockruff", 745: "Lycanroc",
  757: "Salandit", 758: "Salazzle",
  778: "Mimikyu",
  789: "Cosmog", 790: "Cosmoem",
  791: "Solgaleo", 792: "Lunala", 800: "Necrozma",
  807: "Zeraora",
  810: "Grookey", 811: "Thwackey", 812: "Rillaboom",
  813: "Scorbunny", 814: "Raboot", 815: "Cinderace",
  823: "Corviknight",
  831: "Wooloo", 832: "Dubwool",
  849: "Toxtricity",
  863: "Obstagoon",
  872: "Snom", 873: "Frosmoth",
  885: "Dreepy", 886: "Drakloak", 887: "Dragapult",
  888: "Zacian", 889: "Zamazenta",
  892: "Urshifu", 898: "Calyrex",
  906: "Sprigatito", 907: "Floragato", 908: "Meowscarada",
  909: "Fuecoco", 910: "Crocalor", 911: "Skeledirge",
  912: "Quaxly", 913: "Quaxwell", 914: "Quaquaval",
  926: "Fidough", 927: "Dachsbun",
  936: "Armarouge", 937: "Ceruledge",
  959: "Tinkaton",
  1007: "Koraidon", 1008: "Miraidon", 1017: "Ogerpon"
};

export const TIER_1_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 25, 26, 35, 37, 38, 39, 40, 52, 53, 54, 
  55, 58, 59, 63, 65, 66, 68, 79, 80, 94, 95, 130, 131, 133, 134, 135, 136, 
  143, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 172, 
  175, 176, 179, 180, 181, 194, 196, 197, 212, 214, 228, 229, 246, 247, 
  248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 282, 
  303, 330, 359, 376, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 
  390, 391, 392, 393, 394, 395, 447, 448, 470, 471, 483, 484, 487, 493
];

export const TIER_2_IDS = [
  403, 404, 405, 443, 444, 445, 475, 494, 495, 496, 497, 498, 499, 500, 
  501, 502, 503, 610, 611, 612, 633, 634, 635, 637, 643, 644, 646, 649, 
  653, 654, 655, 656, 657, 658, 681, 700, 704, 705, 706, 716, 717, 718, 
  719, 720, 722, 723, 724, 725, 726, 727, 736, 738, 744, 745, 757, 758, 
  778, 789, 790, 791, 792, 800, 807, 810, 811, 812, 813, 814, 815, 823, 
  831, 832, 849, 863, 872, 873, 885, 886, 887, 888, 889, 892, 898, 906, 
  907, 908, 909, 910, 911, 912, 913, 914, 926, 927, 936, 937, 959, 1007, 
  1008, 1017
];

export function getPokemonName(id) {
  return POKEMON_MAP[id] || `Pokémon #${id}`;
}

// Mega Milestone Pokemon
export const MEGA_POKEMON = [
  { id: 658, name: 'Greninja' },
  { id: 382, name: 'Kyogre' },
  { id: 249, name: 'Lugia' },
  { id: 384, name: 'Rayquaza' }
];

// Starter Configurations
export const STARTER_OPTIONS = [
  { familyId: '25', baseId: '25', name: 'Pikachu' },
  { familyId: '4', baseId: '4', name: 'Charmander' },
  { familyId: '1', baseId: '1', name: 'Bulbasaur' },
  { familyId: '7', baseId: '7', name: 'Squirtle' },
  { familyId: '133', baseId: '133', name: 'Eevee' }
];

export const STARTER_FAMILIES = STARTER_OPTIONS.map(o => o.familyId);

// Evolution configurations
export const EVOLUTIONS = {
  '25': {
    stages: [
      { level: 1, id: '25', name: 'Pikachu' },
      { level: 5, id: '26', name: 'Raichu' }
    ]
  },
  '4': {
    stages: [
      { level: 1, id: '4', name: 'Charmander' },
      { level: 5, id: '5', name: 'Charmeleon' },
      { level: 10, id: '6', name: 'Charizard' }
    ]
  },
  '1': {
    stages: [
      { level: 1, id: '1', name: 'Bulbasaur' },
      { level: 5, id: '2', name: 'Ivysaur' },
      { level: 10, id: '3', name: 'Venusaur' }
    ]
  },
  '7': {
    stages: [
      { level: 1, id: '7', name: 'Squirtle' },
      { level: 5, id: '8', name: 'Wartortle' },
      { level: 10, id: '9', name: 'Blastoise' }
    ]
  },
  '133': {
    stages: [
      { level: 1, id: '133', name: 'Eevee' }
    ],
    options: [
      { id: '134', name: 'Vaporeon' },
      { id: '135', name: 'Jolteon' },
      { id: '136', name: 'Flareon' },
      { id: '196', name: 'Espeon' },
      { id: '197', name: 'Umbreon' },
      { id: '470', name: 'Leafeon' },
      { id: '471', name: 'Glaceon' },
      { id: '700', name: 'Sylveon' }
    ]
  }
};
