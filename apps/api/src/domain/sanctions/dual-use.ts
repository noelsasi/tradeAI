import type { SanctionStatus } from '@tradeai/types';

// Specific 6-digit HS prefixes with genuine UAE Strategic Commodities / dual-use controls.
// Source: UAE Federal Law No. 13 of 2007 + WCO dual-use list.
// Broad chapter-level flagging is intentionally excluded — it produces false positives
// on common goods (e.g. kitchen appliances in Ch.84, light bulbs in Ch.85).
const DUAL_USE_PREFIXES: ReadonlyMap<string, string> = new Map([
  // Nuclear
  ['840110', 'Nuclear reactors'],
  ['840120', 'Nuclear fuel elements (cartridges)'],
  // Machinery with CW/export-control implications
  ['841350', 'Reciprocating displacement pumps — CW precursor transfer'],
  ['845710', 'Machining centres for working metal (CNC)'],
  // Aircraft & UAVs
  ['880211', 'Helicopters ≤2,000 kg'],
  ['880212', 'Helicopters >2,000 kg'],
  ['880220', 'Aeroplanes ≤2,000 kg'],
  ['880230', 'Aeroplanes 2,000–15,000 kg'],
  ['880240', 'Aeroplanes >15,000 kg'],
  // Chemicals — specific controlled substances
  ['281410', 'Anhydrous ammonia — CW precursor'],
  ['281700', 'Zinc oxide / peroxide — precursor'],
  ['292910', 'Isocyanates — CW precursor'],
  // Explosives & pyrotechnics
  ['360100', 'Propellant powders'],
  ['360200', 'Prepared explosives'],
  ['360300', 'Safety fuses / detonating fuses'],
  ['360410', 'Fireworks'],
  ['360500', 'Matches (safety)'],
  // Arms & ammunition
  ['930100', 'Military weapons'],
  ['930190', 'Military weapons — other'],
  ['930200', 'Revolvers and pistols'],
  ['930300', 'Sporting / hunting firearms'],
  ['930590', 'Firearm parts and accessories'],
  ['930630', 'Cartridges and parts — rifles/pistols'],
  ['930690', 'Ammunition — other'],
  // Optical / night-vision / laser
  ['900510', 'Binoculars — includes night-vision'],
  ['900540', 'Astronomical instruments'],
  ['902000', 'Laser rangefinders / designators'],
]);

export interface DualUseResult {
  isDualUse: boolean;
  flagNote: string | null;
  riskLevel: SanctionStatus;
}

export function checkDualUse(hsCode: string): DualUseResult {
  const digits = hsCode.replace(/\./g, '');
  const prefix6 = digits.slice(0, 6);

  const match = DUAL_USE_PREFIXES.get(prefix6);
  if (match) {
    return {
      isDualUse: true,
      flagNote: `Dual-use / export-controlled: ${match}. UAE Strategic Commodities Law applies — verify export licence before shipment.`,
      riskLevel: 'Flagged',
    };
  }

  return { isDualUse: false, flagNote: null, riskLevel: 'Clear' };
}
