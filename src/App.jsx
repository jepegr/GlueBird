import { useState, useMemo } from "react";

/* ---------------------------------------------------------
   GLUEBIRD — material pairing -> adhesive recommendation
   All copy, rules and visuals below are original.

   AFFILIATE SETUP: replace AFFILIATE_TAG below with your own
   Amazon Associates tracking ID (or swap productLink() for
   another program's URL format). Every "View product" button
   runs through productLink(), so one edit updates the whole
   site. Until you set a real tag, links point to a plain
   Amazon search with no tracking attached.
--------------------------------------------------------- */

const AFFILIATE_TAG = "YOUR-AFFILIATE-TAG-20"; // TODO: replace with your Associates ID

function productLink(query) {
  const q = encodeURIComponent(query);
  const tagged = AFFILIATE_TAG.startsWith("YOUR-")
    ? ""
    : `&tag=${encodeURIComponent(AFFILIATE_TAG)}`;
  return `https://www.amazon.com/s?k=${q}${tagged}`;
}

const MATERIALS = [
  { id: "wood", label: "Wood", group: "porous-rigid", texture: "wood" },
  { id: "metal", label: "Metal", group: "nonporous-rigid", texture: "metal" },
  { id: "glass", label: "Glass", group: "nonporous-rigid", texture: "glass" },
  { id: "ceramic", label: "Ceramic", group: "nonporous-rigid", texture: "ceramic" },
  { id: "rigidplastic", label: "Rigid Plastic", group: "nonporous-rigid", texture: "rigidplastic" },
  { id: "flexplastic", label: "Flexible Plastic", group: "nonporous-flex", texture: "flexplastic" },
  { id: "rubber", label: "Rubber", group: "nonporous-flex", texture: "rubber" },
  { id: "foam", label: "Foam", group: "porous-flex-foam", texture: "foam" },
  { id: "fabric", label: "Fabric / Leather", group: "porous-flex", texture: "fabric" },
  { id: "paper", label: "Paper / Card", group: "porous-flex-thin", texture: "paper" },
  { id: "stone", label: "Stone / Concrete", group: "porous-rigid-heavy", texture: "stone" },
  { id: "cork", label: "Cork", group: "porous-rigid-light", texture: "cork" },
];

const ADHESIVES = {
  pva: {
    name: "PVA wood glue", cure: "24 hrs", strength: 4, water: false,
    products: [
      { name: "Titebond II Premium Wood Glue", blurb: "The standard choice in most workshops — water-resistant once cured, sands and stains cleanly." },
      { name: "Elmer's Carpenter's Wood Glue Max", blurb: "A cheaper everyday option that holds up fine on furniture and craft work that stays indoors." },
    ],
  },
  epoxy: {
    name: "2-part epoxy", cure: "4–24 hrs", strength: 5, water: true,
    products: [
      { name: "J-B Weld KwikWeld", blurb: "Steel-reinforced formula built for real load — the one people reach for on metal repairs." },
      { name: "Gorilla Epoxy (5-Minute Set)", blurb: "Dries clear and sets fast, which makes it easier to work with on visible or small repairs." },
    ],
  },
  ca: {
    name: "Cyanoacrylate (superglue)", cure: "1–2 min", strength: 4, water: true,
    products: [
      { name: "Loctite Super Glue Ultra Gel Control", blurb: "Thicker than standard superglue, so it doesn't run on vertical or uneven surfaces." },
      { name: "Gorilla Super Glue Gel", blurb: "A dependable gel formula for small, tight-fitting breaks that need to grab instantly." },
    ],
  },
  contact: {
    name: "Contact cement", cure: "instant bond, 24 hr full cure", strength: 4, water: true,
    products: [
      { name: "DAP Weldwood Contact Cement", blurb: "The classic brush-on cement for laminate, rubber, and leather — coat both sides and let it flash off." },
      { name: "3M Super 77 Spray Adhesive", blurb: "A sprayable option that's easier to lay down evenly across large flat panels." },
    ],
  },
  poly: {
    name: "Polyurethane glue", cure: "1–2 hrs, 24 hr full cure", strength: 5, water: true,
    products: [
      { name: "Gorilla Original Glue", blurb: "Expands slightly as it cures, filling small gaps between mismatched or rough surfaces." },
      { name: "Titebond Polyurethane Glue", blurb: "A cleaner-curing alternative for outdoor furniture and anything that needs real water resistance." },
    ],
  },
  silicone: {
    name: "Silicone sealant", cure: "24 hrs", strength: 3, water: true,
    products: [
      { name: "GE Silicone II Window & Door", blurb: "Stays flexible for years, which is exactly what a glass-to-frame joint needs." },
      { name: "Loctite Clear Silicone Waterproof Sealant", blurb: "A general-purpose clear silicone for anything that needs to shrug off moisture." },
    ],
  },
  hotglue: {
    name: "Hot glue", cure: "60 sec", strength: 2, water: false,
    products: [
      { name: "Surebonder High-Temp Glue Sticks", blurb: "Bonds faster and holds better than low-temp sticks for craft and light repair work." },
      { name: "Gorilla Hot Glue Sticks", blurb: "A reliable everyday stick for a standard glue gun." },
    ],
  },
  fabricglue: {
    name: "Fabric / leather adhesive", cure: "2–4 hrs", strength: 3, water: false,
    products: [
      { name: "Aleene's Leather & Suede Glue", blurb: "Dries clear and flexible, so it won't stain or stiffen the material at the seam." },
      { name: "Tear Mender Fabric & Leather Adhesive", blurb: "A washable, water-based option built specifically for upholstery and repairs that need to bend." },
    ],
  },
  construction: {
    name: "Construction adhesive", cure: "24–48 hrs", strength: 5, water: true,
    products: [
      { name: "Loctite PL Premium Construction Adhesive", blurb: "A masonry-rated adhesive that holds outdoors through real temperature swings." },
      { name: "Liquid Nails Fuze*It Max All-Surface Adhesive", blurb: "One tube that bridges stone, wood, and metal on the same heavy-duty job." },
    ],
  },
  craft: {
    name: "All-purpose craft glue", cure: "30 min", strength: 2, water: false,
    products: [
      { name: "Elmer's Craft Bond Multi-Purpose", blurb: "A light, low-mess glue for paper and card projects that don't need real strength." },
      { name: "Aleene's Original Tacky Glue", blurb: "Grabs faster than standard white glue, which helps on small or fiddly craft pieces." },
    ],
  },
  foamsafe: {
    name: "Foam-safe adhesive spray", cure: "10–30 min", strength: 3, water: false,
    products: [
      { name: "3M Foam Fast 74 Spray Adhesive", blurb: "Formulated specifically not to eat into foam — the safe default for cushions and craft foam." },
      { name: "Loctite Foam-Safe Adhesive", blurb: "A precise, low-odor option for smaller foam projects and model-making." },
    ],
  },
};

// Hand-written overrides for combinations with a well-known best answer or a common mistake.
const OVERRIDES = {
  "glass|metal": { a: "epoxy", tip: "Epoxy bridges the different expansion rates of glass and metal better than CA glue, which can pop loose once it's jarred." },
  "glass|glass": { a: "ca", tip: "For small pieces, gel-type CA sets almost instantly; switch to epoxy if the joint has any gap to fill." },
  "wood|metal": { a: "epoxy", tip: "Rough up the metal with fine sandpaper first — epoxy grips a scuffed surface far better than one straight off the shelf." },
  "wood|glass": { a: "silicone", tip: "Silicone flexes with wood's seasonal movement, so the glass won't crack when the wood expands or contracts." },
  "rubber|metal": { a: "contact", tip: "Coat both surfaces, let the cement go tacky before joining — rubber-to-metal bonds fail most often from rushing this step." },
  "rubber|rubber": { a: "contact", tip: "A rubber-specific contact cement stays flexible after curing, so the seam moves with the material instead of cracking." },
  "foam|wood": { a: "foamsafe", tip: "Skip anything solvent-based — it will eat through polystyrene or EVA foam within seconds." },
  "foam|metal": { a: "foamsafe", tip: "Craft glue also works if you can clamp it; just avoid contact cement and CA, both attack foam." },
  "foam|foam": { a: "foamsafe", tip: "Hot glue works in a pinch but can melt a shallow crater into soft foams — test on an offcut first." },
  "fabric|fabric": { a: "fabricglue", tip: "Apply a thin, even line and press with a roller rather than fingers, or the bond telegraphs through as a stiff ridge." },
  "fabric|wood": { a: "fabricglue", tip: "Fabric glue stays flexible where wood glue would crack the cloth at the fold line." },
  "fabric|metal": { a: "epoxy", tip: "Roughen the metal side lightly and use a small dab — too much epoxy will soak through and stiffen the fabric." },
  "paper|paper": { a: "craft", tip: "A glue stick avoids the wrinkling that liquid craft glue causes on thin paper." },
  "stone|stone": { a: "construction", tip: "For anything load-bearing, a masonry-rated construction adhesive outperforms epoxy once temperatures swing outdoors." },
  "stone|wood": { a: "construction", tip: "Let the adhesive's full cure time pass before any weight goes on the joint — stone's weight punishes an early load." },
  "stone|metal": { a: "epoxy", tip: "A slow-set epoxy gives you time to align heavy stone before it grabs." },
  "cork|wood": { a: "pva", tip: "Cork is porous enough that ordinary wood glue soaks in and holds fine — no need for anything stronger." },
  "cork|cork": { a: "craft", tip: "Spread thin; cork's texture already gives the glue plenty to key into." },
  "rigidplastic|rigidplastic": { a: "ca", tip: "Check the plastic first — CA glue doesn't bond polypropylene or polyethylene at all, no matter the brand." },
  "flexplastic|flexplastic": { a: "contact", tip: "Vinyl and other flexible plastics need a bond that flexes with them, or the seam cracks at the first fold." },
  "flexplastic|metal": { a: "epoxy", tip: "Clean the plastic with alcohol first — mould-release residue is the most common reason this joint fails." },
};

function propsOf(m) {
  const g = m.group;
  return {
    porous: g.startsWith("porous"),
    flexible: g.includes("flex"),
    heavy: g.includes("heavy"),
    thin: g.includes("thin"),
    foamLike: g.includes("foam"),
  };
}

function pairKey(idA, idB) {
  return [idA, idB].sort().join("|");
}

function recommend(idA, idB) {
  const key1 = pairKey(idA, idB);
  if (OVERRIDES[key1]) {
    const o = OVERRIDES[key1];
    return { adhesive: ADHESIVES[o.a], tip: o.tip, key: o.a };
  }
  const A = MATERIALS.find((m) => m.id === idA);
  const B = MATERIALS.find((m) => m.id === idB);
  const pa = propsOf(A), pb = propsOf(B);

  let key, tip;
  if (pa.foamLike || pb.foamLike) {
    key = "foamsafe";
    tip = "Foam breaks down around solvent-based glues, so stick to a foam-rated adhesive even if it feels like the weaker option.";
  } else if (pa.heavy || pb.heavy) {
    key = "construction";
    tip = "Anything this heavy wants a gap-filling, high-load adhesive rather than a thin glue line.";
  } else if (pa.porous && pb.porous) {
    key = pa.thin || pb.thin ? "craft" : "pva";
    tip = "Both surfaces are porous, so a water-based glue soaks in and grips without needing a chemical bond.";
  } else if (!pa.porous && !pb.porous && !pa.flexible && !pb.flexible) {
    key = "epoxy";
    tip = "Two smooth, rigid, non-porous surfaces bond most reliably with epoxy, since there's no texture for a thinner glue to grip.";
  } else if (pa.flexible && pb.flexible) {
    key = "contact";
    tip = "Matching flexible materials need a bond that moves with both sides, or it delaminates at the first stress point.";
  } else if (pa.flexible || pb.flexible) {
    key = "silicone";
    tip = "One rigid and one flexible surface do best with a bond that can absorb the movement without cracking.";
  } else {
    key = "epoxy";
    tip = "A mixed pair like this bonds most consistently with epoxy, which grips both porous and smooth surfaces at once.";
  }
  return { adhesive: ADHESIVES[key], tip, key };
}

const TEXTURE_STYLES = {
  wood: { background: "repeating-linear-gradient(100deg, #9c6b3f 0px, #8a5a32 3px, #a9754a 6px, #8a5a32 9px)" },
  metal: { background: "repeating-linear-gradient(95deg, #b7bcc2 0px, #9aa0a6 2px, #c7ccd1 4px, #9aa0a6 6px)" },
  glass: { background: "linear-gradient(135deg, rgba(200,225,225,0.55), rgba(150,190,190,0.35))" },
  ceramic: { background: "linear-gradient(140deg, #eee6da 0%, #d8cbb8 60%, #efe7db 100%)" },
  rigidplastic: { background: "linear-gradient(140deg, #cfd6da 0%, #eef1f2 40%, #c3cbcf 100%)" },
  flexplastic: { background: "repeating-linear-gradient(60deg, #3fa7a0 0px, #368f89 4px, #4bb8b0 8px)" },
  rubber: { background: "radial-gradient(circle at 20% 30%, #3a3a3a 1px, transparent 1.5px), radial-gradient(circle at 60% 70%, #3a3a3a 1px, transparent 1.5px), #1f1f1f", backgroundSize: "10px 10px, 10px 10px, auto" },
  foam: { background: "radial-gradient(circle, #f2d98a 2px, transparent 2.5px), #e9c465", backgroundSize: "9px 9px" },
  fabric: { background: "repeating-conic-gradient(#8b5a44 0deg 90deg, #a8724f 90deg 180deg)", backgroundSize: "8px 8px" },
  paper: { background: "repeating-linear-gradient(180deg, #e8e2d4 0px, #e8e2d4 7px, #d9d2c0 8px)" },
  stone: { background: "radial-gradient(circle at 30% 40%, #9a958c 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #82796d 1.5px, transparent 2px), #aca699", backgroundSize: "6px 6px, 11px 11px, auto" },
  cork: { background: "radial-gradient(circle at 25% 30%, #c98f52 1.5px, transparent 2px), radial-gradient(circle at 65% 65%, #b87c40 1px, transparent 1.5px), #d9a262", backgroundSize: "7px 7px, 5px 5px, auto" },
};

function Swatch({ material, selected, onClick }) {
  return (
    <button onClick={onClick} className={`swatch ${selected ? "swatch-selected" : ""}`} aria-pressed={selected}>
      <span className="swatch-texture" style={TEXTURE_STYLES[material.texture]} />
      <span className="swatch-label">{material.label}</span>
    </button>
  );
}

function StrengthMeter({ value }) {
  return (
    <div className="meter" aria-label={`Bond strength ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`meter-pip ${i <= value ? "meter-pip-filled" : ""}`} />
      ))}
    </div>
  );
}

export default function Gluebird() {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [shareFlash, setShareFlash] = useState(false);

  const result = useMemo(() => (a && b ? recommend(a, b) : null), [a, b]);
  const matA = MATERIALS.find((m) => m.id === a);
  const matB = MATERIALS.find((m) => m.id === b);

  async function shareResult() {
    if (!result || !matA || !matB) return;
    const text = `${matA.label} + ${matB.label} -> ${result.adhesive.name}. Worked out what glues almost anything to anything else on Gluebird.`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareFlash(true);
        setTimeout(() => setShareFlash(false), 1600);
      }
    } catch (e) { console.error("Could not copy share text", e); }
  }

  function pick(id, target) {
    if (target === "a") setA(id === a ? null : id);
    else setB(id === b ? null : id);
  }

  return (
    <div className="bb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&family=Roboto+Mono:wght@500&display=swap');

        .bb-root {
          --bg:#FFFFFF; --ink:#141311; --dim:#5C594E; --hair:#E4E0D4;
          --orange:#FF6A00; --orange-deep:#D45700; --black:#141311;
          --rust:#C1440E;
          --line:#141311;
          background: var(--bg); color: var(--ink);
          font-family: 'Barlow', sans-serif;
          min-height: 100%; padding: 0 0 60px;
        }
        .bb-header { max-width: 900px; margin: 0 auto; padding: 30px 18px 0; }
        .bb-eyebrow {
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--bg); background: var(--orange); display: inline-block; padding: 3px 10px; margin: 0 0 12px;
        }
        .bb-title {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase;
          font-size: clamp(46px, 10vw, 80px); letter-spacing: 0.01em; line-height: 0.88; margin: 0 0 12px; color: var(--black);
        }
        .bb-sub { color: var(--dim); max-width: 54ch; font-size: 16px; line-height: 1.5; font-weight: 500; }

        .bb-board { max-width: 900px; margin: 30px auto 0; padding: 0 18px; display: grid; gap: 22px; }
        .bb-columns { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 720px) { .bb-columns { grid-template-columns: 1fr 1fr; } }
        .bb-col-label {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--black); margin-bottom: 10px; display: block; border-bottom: 3px solid var(--black); padding-bottom: 6px;
        }
        .swatch-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .swatch {
          border: 2px solid var(--hair); background: var(--bg); border-radius: 3px;
          padding: 10px 8px 9px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;
          transition: border-color .15s ease, transform .1s ease, box-shadow .15s ease; color: var(--ink);
        }
        .swatch:hover { border-color: var(--black); }
        .swatch:active { transform: scale(0.97); }
        .swatch-selected { border-color: var(--orange); box-shadow: 3px 3px 0 var(--orange); }
        .swatch-texture { width: 100%; height: 40px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25); }
        .swatch-label { font-size: 12.5px; font-weight: 600; text-align: center; line-height: 1.2; }

        .bb-seam { position: relative; height: 46px; display: flex; align-items: center; justify-content: center; }
        .bb-seam-line { position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: var(--hair); }
        .bb-drip {
          position: relative; z-index: 1; font-family: 'Roboto Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500;
          background: var(--bg); padding: 5px 14px; border-radius: 999px; border: 2px solid var(--hair); color: var(--dim);
          transition: border-color .25s ease, color .25s ease;
        }
        .bb-drip-active { border-color: var(--orange); color: var(--orange-deep); }

        .bb-card {
          border: 3px solid var(--black); border-radius: 4px;
          background: var(--bg);
          padding: 24px 22px; animation: rise .35s ease both;
        }
        @keyframes rise { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .bb-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
        .bb-adhesive-name {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase;
          font-size: 34px; letter-spacing: 0.01em; color: var(--black); line-height: 1;
        }
        .bb-pairline { font-family: 'Roboto Mono', monospace; font-size: 11.5px; color: var(--dim); margin-top: 4px; }
        .bb-meta { display: flex; gap: 0; flex-wrap: wrap; margin: 10px 0 16px; border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); }
        .bb-meta-item { display: flex; flex-direction: column; gap: 3px; padding: 10px 22px 10px 0; font-family: 'Roboto Mono', monospace; font-size: 11.5px; color: var(--ink); }
        .bb-meta-key { color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; }
        .meter { display: flex; gap: 3px; }
        .meter-pip { width: 14px; height: 7px; border-radius: 1px; background: var(--hair); }
        .meter-pip-filled { background: var(--orange); }

        .bb-tip { border-left: 4px solid var(--rust); padding-left: 13px; font-size: 15px; line-height: 1.55; color: var(--ink); margin-bottom: 18px; font-weight: 500; }
        .bb-prep { font-size: 13.5px; color: var(--dim); line-height: 1.6; margin-bottom: 20px; }
        .bb-prep b { color: var(--ink); }

        .bb-products-label {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--black); margin-bottom: 10px; border-bottom: 3px solid var(--black); padding-bottom: 6px;
        }
        .bb-products { display: grid; gap: 10px; margin-bottom: 18px; }
        .bb-product { border: 2px solid var(--hair); border-radius: 3px; padding: 13px 15px; display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .bb-product-name { font-weight: 700; font-size: 14.5px; margin-bottom: 3px; }
        .bb-product-blurb { font-size: 12.5px; color: var(--dim); line-height: 1.45; max-width: 44ch; }
        .bb-product-cta {
          background: var(--orange); color: var(--bg); border: 2px solid var(--orange); border-radius: 2px;
          padding: 9px 16px; font-size: 12.5px; font-weight: 700; text-decoration: none; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .bb-product-cta:hover { background: var(--orange-deep); border-color: var(--orange-deep); }
        .bb-affiliate-note { font-size: 10.5px; color: var(--dim); margin-top: 2px; }

        .bb-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .bb-note-input {
          flex: 1; min-width: 160px; background: var(--bg); border: 2px solid var(--hair);
          border-radius: 2px; padding: 9px 10px; color: var(--ink); font-size: 13.5px; font-family: 'Barlow', sans-serif;
        }
        .bb-note-input::placeholder { color: var(--dim); }
        .bb-save-btn { background: var(--black); color: var(--bg); border: 2px solid var(--black); border-radius: 2px; padding: 9px 18px; font-weight: 700; font-size: 13.5px; cursor: pointer; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em; }
        .bb-save-btn:hover { background: var(--orange); border-color: var(--orange); }
        .bb-share-btn { background: var(--bg); color: var(--black); border: 2px solid var(--black); border-radius: 2px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em; }
        .bb-share-btn:hover { background: var(--hair); }
        .bb-save-flash { font-size: 12px; color: var(--orange-deep); margin-top: 8px; font-family: 'Roboto Mono', monospace; font-weight: 500; }

        .bb-empty { text-align: center; color: var(--dim); font-size: 13.5px; padding: 30px 10px; border: 2px dashed var(--hair); border-radius: 4px; }

        .bb-two-col { display: grid; gap: 22px; margin-top: 36px; }
        @media (min-width: 720px) { .bb-two-col { grid-template-columns: 1fr 1fr; } }
        .bb-log-title {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase;
          font-size: 24px; color: var(--black); letter-spacing: 0.01em; margin-bottom: 12px;
        }
        .bb-log-list, .bb-board-list { display: grid; gap: 8px; }
        .bb-log-item, .bb-board-item {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          border: 2px solid var(--hair); border-radius: 3px; padding: 10px 12px; font-size: 13px;
        }
        .bb-log-item-main { display: flex; flex-direction: column; gap: 2px; }
        .bb-log-item-pair { font-weight: 700; }
        .bb-log-item-note { color: var(--dim); font-size: 12.5px; }
        .bb-log-item-adh { color: var(--orange-deep); font-family: 'Roboto Mono', monospace; font-size: 11.5px; font-weight: 500; }
        .bb-remove { background: none; border: none; color: var(--dim); cursor: pointer; font-size: 16px; line-height: 1; padding: 4px; }
        .bb-remove:hover { color: var(--rust); }
        .bb-board-rank { font-family: 'Barlow Condensed', sans-serif; color: var(--bg); background: var(--black); font-weight: 800; width: 22px; height: 22px; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
        .bb-board-count { font-family: 'Roboto Mono', monospace; color: var(--dim); font-size: 11.5px; }

        .bb-footnote { max-width: 900px; margin: 32px auto 0; padding: 0 18px; font-size: 11.5px; color: var(--dim); line-height: 1.6; }
      `}</style>

      <header className="bb-header">
        <p className="bb-eyebrow">Workbench reference</p>
        <h1 className="bb-title">GLUEBIRD</h1>
        <p className="bb-sub">
          Pick what you're joining on each side of the bench. You'll get a straight
          answer on the adhesive, why it's the right call, real products to buy,
          and what to do before the glue ever touches the surface.
        </p>
      </header>

      <div className="bb-board">
        <div className="bb-columns">
          <div>
            <span className="bb-col-label">Surface A</span>
            <div className="swatch-grid">
              {MATERIALS.map((m) => (
                <Swatch key={m.id} material={m} selected={a === m.id} onClick={() => pick(m.id, "a")} />
              ))}
            </div>
          </div>
          <div>
            <span className="bb-col-label">Surface B</span>
            <div className="swatch-grid">
              {MATERIALS.map((m) => (
                <Swatch key={m.id} material={m} selected={b === m.id} onClick={() => pick(m.id, "b")} />
              ))}
            </div>
          </div>
        </div>

        <div className="bb-seam">
          <div className="bb-seam-line" />
          <div className={`bb-drip ${a && b ? "bb-drip-active" : ""}`}>{a && b ? "seam set" : "choose both sides"}</div>
        </div>

        {result ? (
          <div className="bb-card">
            <div className="bb-card-head">
              <div>
                <div className="bb-adhesive-name">{result.adhesive.name}</div>
                <div className="bb-pairline">{matA.label} &nbsp;+&nbsp; {matB.label}</div>
              </div>
              <StrengthMeter value={result.adhesive.strength} />
            </div>
            <div className="bb-meta">
              <div className="bb-meta-item"><span className="bb-meta-key">Cure time</span><span>{result.adhesive.cure}</span></div>
              <div className="bb-meta-item"><span className="bb-meta-key">Water resistant</span><span>{result.adhesive.water ? "Yes" : "No — indoor use only"}</span></div>
            </div>

            <p className="bb-tip">{result.tip}</p>

            <p className="bb-prep">
              <b>Before you glue:</b> clean both surfaces of oil, dust, and old
              finish; if either side is glossy or nonporous, scuff it lightly with
              fine sandpaper so the adhesive has something to grip; dry-fit the
              pieces once before the glue goes on so you're not adjusting after
              it's tacky.
            </p>

            <div className="bb-products-label">Products that fit this bond</div>
            <div className="bb-products">
              {result.adhesive.products.map((p) => (
                <div className="bb-product" key={p.name}>
                  <div>
                    <div className="bb-product-name">{p.name}</div>
                    <div className="bb-product-blurb">{p.blurb}</div>
                  </div>
                  <a className="bb-product-cta" href={productLink(p.name)} target="_blank" rel="noopener noreferrer">
                    View product →
                  </a>
                </div>
              ))}
            </div>
            <div className="bb-affiliate-note">
              Product links are affiliate links — if you buy through one, this site may earn a small commission at no extra cost to you.
            </div>

            <div className="bb-actions" style={{ marginTop: 16 }}>
              <button className="bb-share-btn" onClick={shareResult}>Copy to share</button>
            </div>
            {shareFlash && <div className="bb-save-flash">Copied — paste it anywhere.</div>}
          </div>
        ) : (
          <div className="bb-empty">Select a material on each side to see the recommended bond.</div>
        )}
      </div>

      <p className="bb-footnote">
        General guidance for common materials — always check the adhesive's own
        label for specific surfaces, ventilation needs, and safety precautions.
        Product links are affiliate links.
      </p>
    </div>
  );
}
