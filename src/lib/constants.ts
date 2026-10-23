export interface WoodSpecies {
  id: string;
  name: string;
  latinName: string;
  calorificPower: string; // e.g. "2 000 kWh / stère"
  calorificKWhKg: number;
  density: string; // "Élevée (700 kg/m³)"
  emberRetention: string; // "Excellente"
  combustionSpeed: string; // "Lente et régulière"
  barkAndSparks: string; // "Très peu d'étincelles"
  usage: string; // "Idéal pour foyers fermés, inserts et poêles à bois à feu continu"
  dryingTime: string; // "18 à 24 mois ou 48h en étuve industrielle"
  description: string;
}

export const WOOD_SPECIES: WoodSpecies[] = [
  {
    id: 'chene',
    name: 'Chêne (Quercus robur / petraea)',
    latinName: 'Quercus robur',
    calorificPower: '2 100 kWh / stère',
    calorificKWhKg: 4.2,
    density: 'Très élevée (~750 kg/m³ sec)',
    emberRetention: 'Remarquable, braises denses longue durée',
    combustionSpeed: 'Lente et régulière',
    barkAndSparks: 'Faible projection, flammes calmes et généreuses',
    usage: 'La référence absolue pour chauffer tout l\'hiver avec un feu continu.',
    dryingTime: 'Nécessite d\'être lavé des tanins puis séché 24 mois ou étuvé.',
    description: 'Le roi des forêts françaises. Le chêne fournit une chaleur douce et durable avec un tapis de braises exceptionnel qui maintient la température pendant des heures.',
  },
  {
    id: 'hetre',
    name: 'Hêtre (Fagus sylvatica)',
    latinName: 'Fagus sylvatica',
    calorificPower: '2 000 kWh / stère',
    calorificKWhKg: 4.2,
    density: 'Élevée (~710 kg/m³ sec)',
    emberRetention: 'Très bonne, braises constantes',
    combustionSpeed: 'Rapide à moyenne, montée en température vive',
    barkAndSparks: 'Écorce fine, combustion propre sans éclat',
    usage: 'Parfait pour un allumage efficace et une montée en chaleur rapide du foyer.',
    dryingTime: '15 à 18 mois à l\'abri ou étuvage haute température.',
    description: 'Le hêtre produit une flamme claire, vive et lumineuse très esthétique, tout en dégageant un parfum boisé très agréable.',
  },
  {
    id: 'charme',
    name: 'Charme (Carpinus betulus)',
    latinName: 'Carpinus betulus',
    calorificPower: '2 200 kWh / stère',
    calorificKWhKg: 4.3,
    density: 'Extrême (~800 kg/m³ sec)',
    emberRetention: 'La meilleure de tous les bois européens',
    combustionSpeed: 'Très lente, combustion puissante',
    barkAndSparks: 'Zéro étincelle, flamme courte et très chaude',
    usage: 'Le nec plus ultra pour passer la nuit ou obtenir le maximum de calories par bûche.',
    dryingTime: '18 à 24 mois, particulièrement compact et lourd.',
    description: 'Considéré par les professionnels comme le bois au pouvoir calorifique volumique le plus élevé. Il brûle sans crépiter et chauffe intensément.',
  },
  {
    id: 'frene',
    name: 'Frêne (Fraxinus excelsior)',
    latinName: 'Fraxinus excelsior',
    calorificPower: '1 950 kWh / stère',
    calorificKWhKg: 4.1,
    density: 'Moyenne à élevée (~680 kg/m³ sec)',
    emberRetention: 'Bonne tenue en braises',
    combustionSpeed: 'Modérée, combustion équilibrée',
    barkAndSparks: 'Flamme claire, peu de fumée',
    usage: 'Très polyvalent, facile à fendre et excellent en poêle scandinave.',
    dryingTime: 'Sèche plus vite que le chêne (12 à 15 mois).',
    description: 'Le frêne est apprécié pour sa flamme vive et harmonieuse. Il dégage rapidement une douce chaleur homogène.',
  },
];

export const HUMIDITY_LEVELS = [
  {
    category: 'Bois ultra-sec étuvé (NF H1)',
    rate: '< 18% à 20%',
    pci: '4.2 à 4.5 kWh / kg',
    yield: 'Rendement appareil : 80% à 90%',
    sootRisk: 'Quasi-nul, vitre propre, peu de cendres',
    advice: 'Recommandé par tous les fabricants de poêles à granules et inserts. Allumage immédiat.',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    category: 'Bois sec mi-sec (NF H2)',
    rate: '20% à 25%',
    pci: '3.6 à 3.9 kWh / kg',
    yield: 'Rendement : 65% à 75%',
    sootRisk: 'Modéré, encrassement possible si tirage faible',
    advice: 'Peut être brûlé après 2 à 3 mois de stockage supplémentaire au sec.',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    category: 'Bois vert fraîchement abattu',
    rate: '> 35% à 50%',
    pci: '< 2.2 kWh / kg (l\'eau absorbe la chaleur)',
    yield: 'Rendement désastreux : < 40%',
    sootRisk: 'Danger de bistre, feu de cheminée et fumées toxiques',
    advice: 'À NE JAMAIS BRÛLER. Doit sécher minimum 18 à 24 mois.',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
  },
];

export const FREQUENT_QUESTIONS = [
  {
    q: 'Comment s\'effectue la livraison d\'une palette de bois ?',
    a: 'La livraison est effectuée par un transporteur spécialisé avec un camion porteur équipé d\'un hayon élévateur et d\'un transpalette tout-terrain ou électrique. Le chauffeur décharge la palette au plus près de votre lieu de stockage sous réserve d\'un sol dur et roulant (goudron, pavé, béton) sans marche ni pente excessive.',
  },
  {
    q: 'Pourquoi le paiement par virement bancaire est-il privilégié ?',
    a: 'Le bois de chauffage conditionné en palettes représente des montants significatifs et des frais logistiques lourds. Le virement bancaire est le moyen de règlement le plus sécurisé pour les deux parties, sans risque de fraude à la carte bancaire, sans commission abusive répercutée sur vos prix, avec traçabilité intégrale.',
  },
  {
    q: 'Qu\'est-ce que le bois séché en étuve ?',
    a: 'L\'étuvage est un procédé thermique professionnel où le bois fendu séjourne dans des séchoirs alimentés en chaleur biomasse. Ce cycle réduit l\'humidité à moins de 20% à cœur en quelques jours, élimine insectes, mousses et parasites, et garantit un allumage sans fumée avec un pouvoir calorifique maximal.',
  },
  {
    q: 'Combien de stères correspond une palette de 2 m³ ?',
    a: 'Pour des bûches coupées en 33 cm bien empilées et rangées, 1 stère occupe un volume apparent de 0,70 m³. Une palette contenant 1,40 m³ de bois rangé en 33 cm équivaut donc exactement à 2 stères de bois en vrac.',
  },
  {
    q: 'Puis-je suivre l\'acheminement de ma commande ?',
    a: 'Oui ! Dès la prise en charge de votre commande, vous recevez un lien de suivi sécurisé unique. Vous y retrouvez l\'historique chronologique, le transporteur, le numéro de colis, le compte à rebours estimé et les notifications de passage.',
  },
];
