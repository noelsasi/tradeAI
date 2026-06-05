// TradeAI demo data — realistic UAE freight / customs examples.
// Attached to window so all Babel scripts can read it.
window.TRADEAI_DATA = (function () {
  // Line items as they'd appear on a commercial invoice / packing list,
  // classified by the AI into GCC HS codes (format XXXX.XX.XXXX).
  const items = [
    {
      id: 1,
      desc: 'Dell Latitude 5440 Notebook, 14" FHD, Intel Core i5, 16GB RAM, 512GB SSD',
      origin: 'China',
      qty: '120 units',
      hs: '8471.30.0000',
      title: 'Portable automatic data processing machines, ≤10kg',
      chapter: 'Ch. 84 — Machinery & mechanical appliances',
      confidence: 97,
      risk: 'Clear',
      reasoning:
        'Classified as portable laptop computers under Chapter 84 — automatic data processing machines. Sub-classification 8471.30 applies to portable units weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display. Form factor and 1.4 kg unit weight confirm portable designation.',
      alternatives: [
        { code: '8471.41.0000', reason: 'Rejected — applies to non-portable ADP machines presented as a system; unit is a standalone portable.' },
        { code: '8471.49.0000', reason: 'Rejected — covers systems presented as multiple separate units; this is a single integrated notebook.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 2,
      desc: "100% Cotton Men's Crew-Neck T-Shirts, knitted, assorted sizes — Carton x 200",
      origin: 'India',
      qty: '48 cartons',
      hs: '6109.10.0000',
      title: 'T-shirts, singlets & other vests, knitted, of cotton',
      chapter: 'Ch. 61 — Apparel, knitted or crocheted',
      confidence: 94,
      risk: 'Clear',
      reasoning:
        'Identified as knitted cotton T-shirts under Chapter 61. Heading 6109 covers T-shirts and singlets that are knitted or crocheted. Material composition (100% cotton) directs to subheading 6109.10.',
      alternatives: [
        { code: '6205.20.0000', reason: 'Rejected — covers woven cotton shirts; goods are knitted, not woven.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 3,
      desc: 'Ordinary Portland Cement OPC 42.5N, grey, 50kg paper bags',
      origin: 'UAE',
      qty: '1,200 bags',
      hs: '2523.29.0000',
      title: 'Portland cement, other than white',
      chapter: 'Ch. 25 — Mineral products',
      confidence: 91,
      risk: 'Clear',
      reasoning:
        'Classified as grey Portland cement under heading 2523. Subheading 2523.29 covers Portland cement other than white, whether or not artificially coloured.',
      alternatives: [
        { code: '2523.21.0000', reason: 'Rejected — reserved for white Portland cement; product is grey OPC.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 4,
      desc: 'LED Panel Light Fixtures, recessed, 600x600mm, 40W, 4000K — retail packed',
      origin: 'China',
      qty: '600 units',
      hs: '9405.40.0000',
      title: 'Other electric lamps & lighting fittings',
      chapter: 'Ch. 94 — Furniture; lamps & lighting fittings',
      confidence: 88,
      risk: 'Review',
      reasoning:
        'Classified as electric lighting fittings under heading 9405. As LED panel luminaires not otherwise specified, subheading 9405.40 applies. Confidence reduced — description does not confirm whether units are mains-powered fixtures or LED modules, which could direct to 8539.',
      alternatives: [
        { code: '8539.52.0000', reason: 'Considered — if presented as bare LED light sources / modules rather than complete fixtures, 8539.52 would apply.' },
        { code: '9405.49.0000', reason: 'Considered — residual subheading; 9405.40 preferred for complete fittings n.e.s.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 5,
      desc: 'Indian Basmati Rice, white, long-grain, milled — 25kg PP bags',
      origin: 'India',
      qty: '800 bags',
      hs: '1006.30.0000',
      title: 'Semi-milled or wholly milled rice',
      chapter: 'Ch. 10 — Cereals',
      confidence: 96,
      risk: 'Clear',
      reasoning:
        'Classified as semi-/wholly milled rice under heading 1006. Milled long-grain Basmati directs to subheading 1006.30.',
      alternatives: [
        { code: '1006.20.0000', reason: 'Rejected — applies to husked (brown) rice; product is milled white rice.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 6,
      desc: 'Lithium-ion Battery Packs, rechargeable, 48V 20Ah, for e-mobility',
      origin: 'China',
      qty: '340 units',
      hs: '8507.60.0000',
      title: 'Lithium-ion accumulators',
      chapter: 'Ch. 85 — Electrical machinery & equipment',
      confidence: 82,
      risk: 'Flagged',
      reasoning:
        'Classified as lithium-ion accumulators under subheading 8507.60. FLAG: goods are UN3480 / UN3481 dangerous goods (Class 9). Dangerous-goods declaration and IATA/IMDG documentation required for clearance. Verify net energy content and packing instruction.',
      alternatives: [
        { code: '8507.80.0000', reason: 'Rejected — residual for other accumulators; chemistry is explicitly lithium-ion.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
      flagNote: 'Dangerous goods (UN3480, Class 9) — DG declaration required.',
    },
    {
      id: 7,
      desc: 'Hot-rolled Steel Reinforcing Bars (rebar), ribbed, grade B500B, 12mm dia.',
      origin: 'Turkey',
      qty: '42,000 kg',
      hs: '7214.20.0000',
      title: 'Bars & rods of iron/steel, containing indentations or ribs',
      chapter: 'Ch. 72 — Iron & steel',
      confidence: 93,
      risk: 'Clear',
      reasoning:
        'Classified as ribbed reinforcing bars under heading 7214. Subheading 7214.20 covers bars and rods containing indentations, ribs, grooves or other deformations produced during rolling — consistent with deformed rebar.',
      alternatives: [
        { code: '7213.10.0000', reason: 'Rejected — applies to bars/rods in irregularly wound coils; product is straight-length rebar.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 8,
      desc: 'Mobile Phone Display Modules & Spare Parts, assorted models — anti-static trays',
      origin: 'China',
      qty: '15 cartons',
      hs: '8517.79.0000',
      title: 'Parts of telephone sets & communication apparatus',
      chapter: 'Ch. 85 — Electrical machinery & equipment',
      confidence: 76,
      risk: 'Review',
      reasoning:
        'Classified as parts of telephone apparatus under heading 8517. Confidence reduced — "assorted models" and mixed components (displays, flex cables) may require itemised classification; display assemblies could fall under 8524 as flat panel display modules.',
      alternatives: [
        { code: '8524.91.0000', reason: 'Considered — standalone flat-panel display modules are classified under 8524 by GIR; mixed consignment kept under parts heading pending line detail.' },
        { code: '8517.62.0000', reason: 'Rejected — covers complete reception/transmission apparatus, not parts.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 9,
      desc: 'Extra Virgin Olive Oil, cold-pressed, glass bottles 750ml — retail cartons',
      origin: 'Spain',
      qty: '300 cartons',
      hs: '1509.20.0000',
      title: 'Extra virgin olive oil',
      chapter: 'Ch. 15 — Animal/vegetable fats & oils',
      confidence: 95,
      risk: 'Clear',
      reasoning:
        'Classified under heading 1509 (olive oil). 2022 HS amendments created subheading 1509.20 specifically for extra virgin olive oil; cold-pressed designation confirms virgin category.',
      alternatives: [
        { code: '1509.30.0000', reason: 'Rejected — covers virgin (non-extra) olive oil; product is labelled extra virgin.' },
        { code: '1509.90.0000', reason: 'Rejected — residual for other olive oil; specific subheading available.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 10,
      desc: 'Split-type Air Conditioners, wall-mounted, 1.5 ton, inverter — indoor + outdoor unit',
      origin: 'Thailand',
      qty: '220 sets',
      hs: '8415.10.0000',
      title: "Air conditioning machines, window or wall types, self-contained / split",
      chapter: 'Ch. 84 — Machinery & mechanical appliances',
      confidence: 90,
      risk: 'Clear',
      reasoning:
        'Classified as air conditioning machines under heading 8415. Subheading 8415.10 covers window or wall types, "split-system", consistent with the described indoor/outdoor split units.',
      alternatives: [
        { code: '8415.81.0000', reason: 'Rejected — applies to other AC machines incorporating a refrigerating unit, used for larger systems, not wall split types.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 11,
      desc: 'Glazed Ceramic Floor Tiles, polished porcelain, 600x600mm — pallets',
      origin: 'China',
      qty: '90 pallets',
      hs: '6907.21.0000',
      title: 'Ceramic flags & tiles, water absorption ≤0.5%',
      chapter: 'Ch. 69 — Ceramic products',
      confidence: 89,
      risk: 'Clear',
      reasoning:
        'Classified as ceramic floor tiles under heading 6907. Polished porcelain with low water absorption (≤0.5%) directs to subheading 6907.21.',
      alternatives: [
        { code: '6907.22.0000', reason: 'Rejected — applies to tiles with water absorption >0.5% but ≤10%; porcelain spec indicates ≤0.5%.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 12,
      desc: 'Diesel Generator Set, 100 kVA, water-cooled, sound-proof canopy — skid mounted',
      origin: 'China',
      qty: '8 units',
      hs: '8502.13.0000',
      title: 'Generating sets with compression-ignition engines, >375 kVA... [check rating]',
      chapter: 'Ch. 85 — Electrical machinery & equipment',
      confidence: 71,
      risk: 'Review',
      reasoning:
        'Classified as diesel generating set under heading 8502. CAUTION: subheading split is by output rating. 100 kVA falls within the >75 ≤375 kVA band (8502.12), not 8502.13 (>375 kVA). Rating on declaration appears inconsistent — verify nameplate kVA before submission.',
      alternatives: [
        { code: '8502.12.0000', reason: 'Likely correct — 8502.12 covers compression-ignition generating sets of output >75 kVA but ≤375 kVA, matching the stated 100 kVA.' },
        { code: '8502.11.0000', reason: 'Rejected — for sets of output ≤75 kVA.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
      flagNote: 'Output rating vs subheading mismatch — verify nameplate before Mirsal 2 submission.',
    },
    {
      id: 13,
      desc: 'Network Surveillance Cameras (IP CCTV), 4MP, IR, PoE — incl. NVR recorder',
      origin: 'China',
      qty: '180 units',
      hs: '8525.89.0000',
      title: 'Television cameras, digital cameras & video camera recorders — other',
      chapter: 'Ch. 85 — Electrical machinery & equipment',
      confidence: 68,
      risk: 'Flagged',
      reasoning:
        'Classified as television cameras under heading 8525. FLAG: consignee "Gulf Watch Security Systems FZE" returned a partial-name match on a watchlist screen (see sanctions panel). Surveillance equipment may also be subject to end-use / dual-use screening. Manual review required before clearance.',
      alternatives: [
        { code: '8525.81.0000', reason: 'Considered — for high-speed cameras; not applicable.' },
        { code: '8517.62.0000', reason: 'Considered — if the NVR is classified separately as reception/recording apparatus; split classification may apply.' },
      ],
      sanctions: { ofac: 'Review', un: 'Clear', eu: 'Clear' },
      flagNote: 'Consignee partial match on OFAC SDN screen — manual sanctions review required.',
    },
    {
      id: 14,
      desc: 'Wheat Flour, fortified, white, for human consumption — 50kg woven bags',
      origin: 'Russia',
      qty: '600 bags',
      hs: '1101.00.0000',
      title: 'Wheat or meslin flour',
      chapter: 'Ch. 11 — Products of the milling industry',
      confidence: 92,
      risk: 'Clear',
      reasoning:
        'Classified as wheat flour under heading 1101. Heading covers wheat or meslin flour; fortification does not change classification.',
      alternatives: [
        { code: '1103.11.0000', reason: 'Rejected — applies to groats and meal of wheat, a coarser product than flour.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 15,
      desc: 'Stainless Steel Kitchen Sinks, double-bowl, 304 grade — flat packed',
      origin: 'China',
      qty: '410 units',
      hs: '7324.10.0000',
      title: 'Sinks & wash basins, of stainless steel',
      chapter: 'Ch. 73 — Articles of iron or steel',
      confidence: 91,
      risk: 'Clear',
      reasoning:
        'Classified as stainless steel sinks under heading 7324 (sanitary ware of iron/steel). Subheading 7324.10 specifically covers sinks and wash basins of stainless steel.',
      alternatives: [
        { code: '7324.90.0000', reason: 'Rejected — residual subheading; specific entry for stainless sinks available.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
    },
    {
      id: 16,
      desc: 'Paracetamol 500mg Tablets, blister packed, retail cartons — pharma grade',
      origin: 'India',
      qty: '50 cartons',
      hs: '3004.90.0000',
      title: 'Medicaments, put up in measured doses or retail packings — other',
      chapter: 'Ch. 30 — Pharmaceutical products',
      confidence: 86,
      risk: 'Review',
      reasoning:
        'Classified as medicaments in measured doses under heading 3004. CAUTION: pharmaceutical imports require MOHAP registration and import permit; ensure controlled-drug screening (paracetamol is non-controlled but permit still applies).',
      alternatives: [
        { code: '3003.90.0000', reason: 'Rejected — for medicaments not put up in measured doses or retail packings; product is blister/retail packed.' },
      ],
      sanctions: { ofac: 'Clear', un: 'Clear', eu: 'Clear' },
      flagNote: 'MOHAP import permit required for pharmaceutical clearance.',
    },
  ];

  const summary = {
    total: items.length,
    clear: items.filter((i) => i.risk === 'Clear').length,
    review: items.filter((i) => i.risk === 'Review').length,
    flagged: items.filter((i) => i.risk === 'Flagged').length,
    sanctions: items.filter((i) => i.sanctions.ofac !== 'Clear' || i.sanctions.un !== 'Clear' || i.sanctions.eu !== 'Clear').length,
    processingTime: 11.8,
    complianceScore: 87,
  };

  const processingSteps = [
    { key: 'extract', label: 'Extracting line items from documents', detail: '16 line items detected across 2 documents' },
    { key: 'classify', label: 'Classifying GCC HS codes', detail: 'Matching against 12-digit GCC tariff schedule' },
    { key: 'screen', label: 'Screening sanctions & watchlists', detail: 'OFAC · UN · EU consolidated lists' },
    { key: 'report', label: 'Generating compliance report', detail: 'Mirsal 2 format · risk scoring' },
  ];

  const docMeta = {
    client: 'Shippify UAE',
    files: ['Commercial_Invoice_INV-2026-04471.pdf', 'Packing_List_PL-04471.pdf'],
    ref: 'INV-2026-04471',
  };

  return { items, summary, processingSteps, docMeta };
})();
