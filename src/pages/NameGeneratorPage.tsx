import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

// ── Syllable banks ──────────────────────────────────────────────────────────

const banks = {
  humanMale: {
    pre: ['Al', 'Bren', 'Car', 'Der', 'Ed', 'Fal', 'Gar', 'Hel', 'Im', 'Jak', 'Kel', 'Lor', 'Mar', 'Nor', 'Os', 'Per', 'Ran', 'Ser', 'Tor', 'Ul', 'Val', 'War', 'Xan', 'Yr', 'Zar'],
    mid: ['a', 'an', 'ar', 'en', 'er', 'ian', 'in', 'on', 'or', 'us'],
    suf: ['ald', 'an', 'as', 'ath', 'en', 'ias', 'in', 'ion', 'is', 'ius', 'oc', 'on', 'or', 'us', 'yn'],
  },
  humanFemale: {
    pre: ['Aer', 'Bel', 'Cal', 'Del', 'El', 'Fae', 'Ger', 'Hel', 'Il', 'Jael', 'Kel', 'Lir', 'Mar', 'Nar', 'Ori', 'Phe', 'Ros', 'Sel', 'Thal', 'Ul', 'Val', 'Wren', 'Xyl', 'Yr', 'Zel'],
    mid: ['a', 'ae', 'an', 'ar', 'el', 'en', 'er', 'ia', 'ie', 'ir', 'or'],
    suf: ['a', 'ae', 'ael', 'ah', 'an', 'ane', 'ara', 'ath', 'ela', 'ene', 'ia', 'iel', 'ina', 'ine', 'ora', 'wyn'],
  },
  elf: {
    pre: ['Aer', 'Ael', 'Cal', 'Cael', 'El', 'Eld', 'Fael', 'Gal', 'Ith', 'Lir', 'Mal', 'Mir', 'Nal', 'Nil', 'Phal', 'Rael', 'Sil', 'Tal', 'Thal', 'Val', 'Vel', 'Xael', 'Ynd', 'Zel'],
    mid: ['a', 'ae', 'ael', 'an', 'ar', 'el', 'en', 'iel', 'il', 'ir', 'or', 'yl'],
    suf: ['ael', 'aer', 'an', 'ath', 'eil', 'el', 'en', 'ene', 'iel', 'il', 'ior', 'ir', 'ith', 'or', 'ril', 'thal', 'yn'],
  },
  dwarf: {
    pre: ['Bor', 'Brom', 'Dag', 'Drak', 'Dur', 'Erd', 'Fal', 'Gim', 'Glar', 'Grun', 'Kor', 'Krag', 'Lok', 'Mog', 'Nor', 'Orf', 'Rad', 'Rak', 'Thag', 'Thor', 'Uld', 'Ulf', 'Vor', 'Wald'],
    mid: ['a', 'ak', 'al', 'ar', 'im', 'in', 'ok', 'or', 'ul', 'un'],
    suf: ['ak', 'ar', 'din', 'dur', 'er', 'id', 'im', 'in', 'kin', 'li', 'lin', 'mir', 'ok', 'or', 'ul', 'un'],
  },
  halfling: {
    pre: ['Bar', 'Bil', 'Cot', 'Del', 'Elm', 'Fin', 'Gil', 'Hal', 'Ivy', 'Jak', 'Kel', 'Lob', 'Mel', 'Nib', 'Ob', 'Pad', 'Pip', 'Rob', 'Sam', 'Tab', 'Tom', 'Wil'],
    mid: ['a', 'an', 'bo', 'do', 'ey', 'in', 'lo', 'o', 'ro', 'to'],
    suf: ['ald', 'ble', 'bo', 'do', 'foot', 'kin', 'le', 'lin', 'lo', 'lock', 'lop', 'ny', 'pin', 'shire', 'son', 'wick', 'wyn'],
  },
  gnome: {
    pre: ['Alz', 'Bim', 'Boz', 'Dim', 'Fiz', 'Giz', 'Nim', 'Pip', 'Pok', 'Qu', 'Rux', 'Siz', 'Snoz', 'Tiz', 'Tock', 'Wim', 'Zap', 'Zib', 'Zim', 'Zip'],
    mid: ['a', 'el', 'er', 'il', 'le', 'ock', 'ot', 'ri', 'ro', 'ul'],
    suf: ['bix', 'crank', 'fink', 'fizzle', 'gear', 'grick', 'mix', 'nik', 'nix', 'pock', 'prick', 'rix', 'spark', 'tix', 'wick', 'wix', 'zap'],
  },
  orc: {
    pre: ['Ag', 'Bog', 'Brug', 'Drak', 'Garg', 'Gor', 'Grak', 'Grom', 'Grul', 'Grum', 'Krag', 'Krul', 'Mag', 'Mog', 'Morg', 'Rok', 'Rug', 'Thak', 'Throk', 'Ug', 'Ugrak', 'Vrak', 'Zog'],
    mid: ['a', 'ag', 'ak', 'ar', 'og', 'ok', 'or', 'ug', 'uk', 'ur'],
    suf: ['ak', 'ash', 'dur', 'gar', 'gash', 'grak', 'grash', 'gut', 'kar', 'kash', 'mak', 'nak', 'nok', 'rak', 'ruk', 'slash', 'smash', 'tusk'],
  },
};

const locationBanks = {
  city: {
    pre: ['Alder', 'Amber', 'Ash', 'Black', 'Bright', 'Crest', 'Crown', 'Dark', 'Dawn', 'Dragon', 'Dusk', 'East', 'Elder', 'Far', 'Gold', 'Grey', 'High', 'Iron', 'Ivory', 'Light', 'Loch', 'Long', 'Moon', 'New', 'Night', 'North', 'Oak', 'Old', 'Red', 'River', 'Rock', 'Rose', 'Silver', 'Star', 'Stone', 'Storm', 'Sun', 'Swift', 'Thorn', 'White', 'Wind'],
    suf: ['burg', 'castle', 'dale', 'den', 'ford', 'gate', 'grove', 'hall', 'harbor', 'haven', 'helm', 'hold', 'home', 'keep', 'mark', 'mere', 'mill', 'moor', 'mouth', 'pass', 'peak', 'port', 'reach', 'ridge', 'rock', 'shore', 'stead', 'thorpe', 'ton', 'tower', 'vale', 'ville', 'ward', 'watch', 'well', 'wick', 'worth'],
  },
  village: {
    pre: ['Briar', 'Brook', 'Clear', 'Clover', 'Croft', 'Dell', 'Down', 'Drift', 'Elm', 'Fern', 'Glen', 'Green', 'Hay', 'Heath', 'Hollow', 'Holt', 'Knoll', 'Lichen', 'Linden', 'Maple', 'Marsh', 'Meadow', 'Mist', 'Moss', 'Nettle', 'Pebble', 'Pine', 'Reed', 'Rush', 'Sedge', 'Shade', 'Twig', 'Willow', 'Wren'],
    suf: ['barrow', 'bottom', 'bridge', 'brook', 'chapel', 'cross', 'crossing', 'dell', 'end', 'field', 'fold', 'ford', 'green', 'hamlet', 'hill', 'hollow', 'hurst', 'lea', 'mill', 'nook', 'stead', 'thorpe', 'ton', 'vale', 'well', 'wood'],
  },
  mountain: {
    pre: ['Ash', 'Black', 'Blood', 'Bone', 'Cold', 'Cracked', 'Crimson', 'Dark', 'Dead', 'Drake', 'Dusk', 'Eagle', 'Ember', 'Frost', 'Giant', 'Grim', 'Howling', 'Iron', 'Jagged', 'Lost', 'Mist', 'Night', 'Raven', 'Scorched', 'Shadow', 'Shattered', 'Silent', 'Skull', 'Snow', 'Sorrow', 'Stone', 'Storm', 'Thunder', 'Titan', 'Veiled', 'Wolf'],
    suf: [' Crag', ' Fangs', ' Horns', ' Peak', ' Pinnacle', ' Ridge', ' Spire', ' Summit', ' Teeth', ' Throne', "'s Back", "'s Crown", "'s Fang", "'s Maw", "'s Spine", "'s Tooth"],
  },
  river: {
    pre: ['Amber', 'Black', 'Clear', 'Cold', 'Crystal', 'Dark', 'Deep', 'Ember', 'Frost', 'Gold', 'Grey', 'Hollow', 'Iron', 'Jade', 'Mist', 'Moon', 'Muddy', 'Night', 'Red', 'Rush', 'Silver', 'Sky', 'Slow', 'Still', 'Storm', 'Swift', 'Teal', 'Twilight', 'White', 'Wild'],
    suf: ['beck', 'bourne', 'brook', 'burn', 'creek', 'current', 'drift', 'fall', 'flow', 'ford', 'pour', 'run', 'rush', 'spill', 'strand', 'stream', 'surge', 'tide', 'trickle', 'wash', 'water', 'way'],
  },
  forest: {
    pre: ['Ancient', 'Ash', 'Black', 'Bone', 'Cursed', 'Dark', 'Dead', 'Deep', 'Dream', 'Dusk', 'Eldritch', 'Emerald', 'Eternal', 'Fading', 'Forgotten', 'Ghost', 'Gloam', 'Green', 'Hollow', 'Hushed', 'Jade', 'Mist', 'Moon', 'Moss', 'Murk', 'Night', 'Old', 'Pale', 'Shadow', 'Silent', 'Sleeping', 'Thorn', 'Twilight', 'Umbral', 'Verdant', 'Whispering', 'Wild'],
    suf: [' Canopy', ' Expanse', ' Grove', ' Hollows', ' Shades', ' Stand', ' Tangle', ' Thicket', ' Tangle', ' Veil', ' Weald', ' Wood', 'en Depths', 'wood'],
  },
  dungeon: {
    pre: ['Ashen', 'Bitter', 'Black', 'Blighted', 'Blood', 'Bone', 'Broken', 'Corrupted', 'Cursed', 'Dark', 'Dead', 'Dread', 'Dreaded', 'Dying', 'Eternal', 'Fell', 'Forgotten', 'Forsaken', 'Grim', 'Hollow', 'Haunted', 'Iron', 'Lost', 'Malign', 'Necrotic', 'Old', 'Pit', 'Rotten', 'Ruined', 'Shattered', 'Shadow', 'Shunned', 'Silent', 'Skull', 'Sunken', 'Sunless', 'Tainted', 'Undying', 'Vile'],
    suf: [' Cairn', ' Catacombs', ' Caverns', ' Chambers', ' Citadel', ' Crypt', ' Depths', ' Descent', ' Domain', ' Fortress', ' Halls', ' Keep', ' Labyrinth', ' Lair', ' Maw', ' Ossuary', ' Pits', ' Ruins', ' Sanctum', ' Sepulcher', ' Tomb', ' Tower', ' Vault', ' Warrens'],
  },
};

type NpcCategory = keyof typeof banks;
type LocCategory = keyof typeof locationBanks;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNpcName(category: NpcCategory): string {
  const b = banks[category];
  const roll = Math.random();
  if (roll < 0.4) {
    // pre + suf
    return pick(b.pre) + pick(b.suf);
  } else if (roll < 0.7) {
    // pre + mid + suf
    return pick(b.pre) + pick(b.mid) + pick(b.suf);
  } else {
    // pre + suf (different)
    return pick(b.pre) + pick(b.suf);
  }
}

function generateLocationName(category: LocCategory): string {
  const b = locationBanks[category];
  return pick(b.pre) + pick(b.suf);
}

// ── Label maps ───────────────────────────────────────────────────────────────

const npcLabels: Record<NpcCategory, string> = {
  humanMale: 'Mensch (männlich)',
  humanFemale: 'Mensch (weiblich)',
  elf: 'Elf',
  dwarf: 'Zwerg',
  halfling: 'Halbling',
  gnome: 'Gnom',
  orc: 'Ork / Halbork',
};

const locLabels: Record<LocCategory, string> = {
  city: 'Stadt',
  village: 'Dorf',
  mountain: 'Berg',
  river: 'Fluss',
  forest: 'Wald',
  dungeon: 'Verlies / Ruine',
};

// ── Subcomponents ────────────────────────────────────────────────────────────

function NameList({ names, onCopy }: { names: string[]; onCopy: (n: string) => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
    onCopy(name);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {names.map((name, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 group"
        >
          <span className="text-gray-200 text-sm font-medium select-all">{name}</span>
          <button
            onClick={() => handleCopy(name)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-accent-400 transition-opacity flex-shrink-0"
            title="Kopieren"
          >
            {copied === name ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type Tab = 'npc' | 'location';

export function NameGeneratorPage() {
  const [tab, setTab] = useState<Tab>('npc');
  const [npcCategory, setNpcCategory] = useState<NpcCategory>('humanMale');
  const [locCategory, setLocCategory] = useState<LocCategory>('city');
  const [count, setCount] = useState(10);
  const [npcNames, setNpcNames] = useState<string[]>([]);
  const [locNames, setLocNames] = useState<string[]>([]);
  const [, setLastCopied] = useState<string | null>(null);

  const generateNpc = useCallback(() => {
    const names = Array.from({ length: count }, () => generateNpcName(npcCategory));
    setNpcNames(names);
  }, [npcCategory, count]);

  const generateLoc = useCallback(() => {
    const names = Array.from({ length: count }, () => generateLocationName(locCategory));
    setLocNames(names);
  }, [locCategory, count]);

  const selBase = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors';
  const selActive = 'bg-accent-500/20 text-accent-400';
  const selInactive = 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-100 font-display mb-1">Namensgenerator</h1>
      <p className="text-sm text-gray-500 mb-6">Generiere zufällige Namen für NPCs, Städte und Orte.</p>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-800/50 rounded-xl w-fit">
        <button
          onClick={() => setTab('npc')}
          className={`${selBase} ${tab === 'npc' ? selActive : selInactive}`}
        >
          NPCs
        </button>
        <button
          onClick={() => setTab('location')}
          className={`${selBase} ${tab === 'location' ? selActive : selInactive}`}
        >
          Orte
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        {tab === 'npc' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Rasse / Geschlecht</label>
            <select
              value={npcCategory}
              onChange={e => setNpcCategory(e.target.value as NpcCategory)}
              className="bg-gray-800 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-500/50"
            >
              {(Object.keys(npcLabels) as NpcCategory[]).map(k => (
                <option key={k} value={k}>{npcLabels[k]}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ortstyp</label>
            <select
              value={locCategory}
              onChange={e => setLocCategory(e.target.value as LocCategory)}
              className="bg-gray-800 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-500/50"
            >
              {(Object.keys(locLabels) as LocCategory[]).map(k => (
                <option key={k} value={k}>{locLabels[k]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Anzahl</label>
          <select
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="bg-gray-800 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-500/50"
          >
            {[5, 10, 20, 30].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={tab === 'npc' ? generateNpc : generateLoc}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} />
          Generieren
        </button>
      </div>

      {/* Results */}
      {tab === 'npc' ? (
        npcNames.length > 0 ? (
          <NameList names={npcNames} onCopy={setLastCopied} />
        ) : (
          <div className="text-sm text-gray-600 py-8 text-center">
            Klicke auf „Generieren" um Namen zu erstellen.
          </div>
        )
      ) : (
        locNames.length > 0 ? (
          <NameList names={locNames} onCopy={setLastCopied} />
        ) : (
          <div className="text-sm text-gray-600 py-8 text-center">
            Klicke auf „Generieren" um Namen zu erstellen.
          </div>
        )
      )}
    </div>
  );
}
