/**
 * Centralized image library for the NAGA platform.
 * All images are sourced from Unsplash photographers.
 *
 * Estates — exterior/architectural shots from Nigeria and West Africa
 * Stays   — furnished apartment interiors
 * People  — professional portraits
 * General — hero, banner, and editorial shots
 */

const U = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

// ── Estate buildings ─────────────────────────────────────────────────────────
export const ESTATE_IMAGES = {
  /** Palm Court — residential street, Abuja (© Mac Nzombola) */
  palmCourt: [
    U("1752622176337-5d9315e2df6e", 900, 600),   // street view — palm-lined estate
    U("1658046006173-84fb8288ad4f", 900, 600),   // courtyard / compound view
    U("1771171188673-b186d02c3d12", 900, 600),   // interior courtyard with balconies
    U("1643643704183-f7a8ede67efa", 900, 600),   // row of estate houses (© Inatimi Nathus)
  ],

  /** Dawaki — developing neighbourhood, Abuja (© Inatimi Nathus) */
  dawaki: [
    U("1643643704183-f7a8ede67efa", 900, 600),
    U("1752622176337-5d9315e2df6e", 900, 600),
    U("1658046006173-84fb8288ad4f", 900, 600),
    U("1771171188673-b186d02c3d12", 900, 600),
  ],

  /** Jabi — grand building with palm trees, Abuja (© Vitalis Nwenyi) */
  jabi: [
    U("1745725427804-4d94df0c5eb7", 900, 600),   // grand building, palm trees
    U("1771171188673-b186d02c3d12", 900, 600),
    U("1786609836595-72f93d38f090", 900, 600),
    U("1631049307264-da0ec9d70304", 900, 600),
  ],

  /** Emerald Gardens — Lekki, Lagos high-rise */
  emerald: [
    U("1543414347-1c348021f279", 900, 600),      // white high-rise Lagos (© Structures of Lagos)
    U("1674758978719-6121d8fbefb4", 900, 600),
    U("1502672260266-1c1ef2d93688", 900, 600),
    U("1710075769988-6acb3c618692", 900, 600),   // city view from tall building
  ],

  /** Granite Heights — columned façade, GRA Benin City (© Ferdinand Asakome) */
  granite: [
    U("1643297550841-1386b3a10612", 900, 600),   // white building with columns, Nigeria
    U("1745725427804-4d94df0c5eb7", 900, 600),
    U("1639774274707-09c80b4f53e3", 900, 600),   // city view (© Francis Tokede)
    U("1486406146926-c627a92ad1ab", 900, 600),
  ],
};

// ── NAGA Stays — furnished short-let interiors ───────────────────────────────
export const STAYS_IMAGES = {
  /** Studio unit — modern living space with feature chair */
  studio: [
    U("1785232244548-5cfe6fb60418", 700, 460),   // modern living space, blue chair
    U("1648775933902-f633de370964", 700, 460),   // airy living room
    U("1633505765486-e404bbbec654", 700, 460),   // large bedroom
  ],

  /** One-bedroom — warm sunlit living room */
  oneBed: [
    U("1786564026100-7ad7ae7654b2", 700, 460),   // sunlit living room, beige sofa
    U("1785232244548-5cfe6fb60418", 700, 460),
    U("1734362815901-24bdeb199da5", 700, 460),   // living room chairs
  ],

  /** Two-bedroom — spacious lounge */
  twoBed: [
    U("1648775933902-f633de370964", 700, 460),
    U("1786564026100-7ad7ae7654b2", 700, 460),
    U("1633505765486-e404bbbec654", 700, 460),
  ],

  /** Penthouse / premium — bedroom suite */
  penthouse: [
    U("1633505765486-e404bbbec654", 700, 460),   // luxury bedroom
    U("1786564026100-7ad7ae7654b2", 700, 460),
    U("1785232244548-5cfe6fb60418", 700, 460),
  ],

  /** Banner / hero — general stays unit (sunlit interior) */
  banner: U("1786564026100-7ad7ae7654b2", 1600, 700),
  heroBanner: U("1785232244548-5cfe6fb60418", 1200, 500),
};

// ── People — professional portraits ─────────────────────────────────────────
export const PEOPLE_IMAGES = {
  /** Male professional portraits (West African) */
  maleExec:    U("1614023342667-6f060e9d1e04", 300, 300),   // man, dark shirt (© Olawale Munna)
  maleStaff1:  U("1617244147299-5ef406921c35", 300, 300),   // man in black suit
  maleStaff2:  U("1616805384781-fdcdf0328348", 300, 300),   // man in blue suit
  maleStaff3:  U("1621972758399-da97a9f7e517", 300, 300),   // man in black jacket

  /** Female professional portraits */
  femaleExec:  U("1573496527892-904f897eb744", 300, 300),   // smiling woman professional
  femaleStaff1:U("1666867540898-aaa1993ffabc", 300, 300),   // woman in blue shirt
  femaleStaff2:U("1739300293504-234817eead52", 300, 300),   // woman, laptop
};

// ── General / editorial ──────────────────────────────────────────────────────
export const GENERAL_IMAGES = {
  /** Website hero — modern glass high-rise development (architectural shot) */
  websiteHero:   U("1486406146926-c627a92ad1ab", 1800, 1200),

  /** About / team section */
  teamMeeting:   U("1497366216548-37526070297c", 1600, 600),

  /** Presentation cover — grand building with palm trees */
  presentCover:  U("1745725427804-4d94df0c5eb7", 1400, 800),

  /** Estate compound aerial feel */
  estateAerial:  U("1639774274707-09c80b4f53e3", 900, 600),
};

// ── Listing thumbnails (properties page) ─────────────────────────────────────
export const LISTING_IMAGES = {
  palmCourtUnit:   U("1600607687939-ce8a6c25118c", 600, 400),
  graniteUnit:     U("1643297550841-1386b3a10612", 600, 400),
  emeraldUnit:     U("1543414347-1c348021f279", 600, 400),
  jabiUnit:        U("1745725427804-4d94df0c5eb7", 600, 400),
};
