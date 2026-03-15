export const planCatalog = [
  {
    key: 'dirt',
    name: 'Dirt',
    price: '$0',
    period: 'forever',
    description: 'A starter block for solo explorers getting their first scans online.',
    tagline: 'Free foothold',
    image: '/assets/blocks/Dirt.webp',
    accent: 'from-stone-400/30 via-amber-400/10 to-emerald-400/5',
    badgeTone: 'text-amber-200 border-amber-400/20 bg-amber-500/10',
    features: [
      '40 discovery actions each day',
      'Core scan dashboard',
      '1 saved webhook profile',
      'Basic exports',
    ],
  },
  {
    key: 'iron',
    name: 'Iron',
    price: '$8',
    period: '/month',
    description: 'For regular operators who want faster coverage and cleaner automations.',
    tagline: 'Reliable upgrade',
    image: '/assets/blocks/IronOre.png',
    accent: 'from-slate-200/30 via-indigo-400/10 to-purple-400/10',
    badgeTone: 'text-slate-100 border-slate-200/20 bg-slate-200/10',
    features: [
      '250 discovery actions each day',
      'Unlimited saved searches',
      'Discord test alerts and templates',
      'Early access to future bot slots',
    ],
  },
  {
    key: 'diamond',
    name: 'Diamond',
    price: '$19',
    period: '/month',
    description: 'A sharp mid-tier for creators who want premium scans and expansion room.',
    tagline: 'Most wanted',
    image: '/assets/blocks/DiamondOre.webp',
    accent: 'from-cyan-300/30 via-sky-400/12 to-fuchsia-400/12',
    badgeTone: 'text-cyan-100 border-cyan-300/25 bg-cyan-400/10',
    features: [
      'Unlimited discovery actions',
      'Priority queueing for checks',
      '5 bot profiles reserved',
      'Advanced webhook customization',
    ],
    featured: true,
  },
  {
    key: 'netherite',
    name: 'Netherite',
    price: '$49',
    period: '/month',
    description: 'Heavy-duty access for teams, agencies, and whatever comes after bots launch.',
    tagline: 'Top tier',
    image: '/assets/blocks/NetherriteBlock.webp',
    accent: 'from-rose-400/25 via-fuchsia-500/12 to-red-400/12',
    badgeTone: 'text-rose-100 border-rose-300/25 bg-rose-400/10',
    features: [
      'Shared team membership controls',
      'Unlimited future bot runners',
      'Priority support lane',
      'Custom integrations and rollout help',
    ],
  },
];

export const roleCatalog = [
  { key: 'member', name: 'Member', description: 'Standard dashboard access.' },
  { key: 'customer', name: 'Customer', description: 'Paying account with support access.' },
  { key: 'admin', name: 'Admin', description: 'Can manage plans and roles for everyone.' },
];

export function getPlanMeta(planKey) {
  return planCatalog.find((plan) => plan.key === planKey) || planCatalog[0];
}

export function getRoleMeta(roleKey) {
  return roleCatalog.find((role) => role.key === roleKey) || roleCatalog[0];
}
