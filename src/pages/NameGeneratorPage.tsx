import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

// ── Syllable banks (purely phonetic fantasy) ─────────────────────────────────

const banks = {
  humanMale: {
    pre: ['Al', 'Bren', 'Cael', 'Dar', 'Edh', 'Fal', 'Gar', 'Hael', 'Ith', 'Jor', 'Kel', 'Lor', 'Mar', 'Nor', 'Orath', 'Per', 'Ran', 'Ser', 'Tor', 'Ulv', 'Val', 'Wyr', 'Xan', 'Yr', 'Zar'],
    mid: ['a', 'an', 'ar', 'en', 'er', 'ian', 'in', 'on', 'or', 'us'],
    suf: ['ald', 'ath', 'dor', 'en', 'ias', 'ion', 'ius', 'och', 'ond', 'or', 'rath', 'thas', 'tor', 'us', 'yn'],
  },
  humanFemale: {
    pre: ['Aer', 'Bel', 'Cael', 'Del', 'Elh', 'Fael', 'Gyr', 'Hel', 'Ilh', 'Jael', 'Kel', 'Lir', 'Mael', 'Nar', 'Ori', 'Phel', 'Rael', 'Sel', 'Thal', 'Ulh', 'Val', 'Wren', 'Xyl', 'Yr', 'Zel'],
    mid: ['a', 'ae', 'an', 'ar', 'el', 'en', 'er', 'ia', 'ie', 'ir', 'or'],
    suf: ['a', 'ael', 'ahra', 'ane', 'ara', 'ath', 'ela', 'ene', 'ia', 'iel', 'ina', 'inel', 'ora', 'wynn', 'yth'],
  },
  elf: {
    pre: ['Aer', 'Ael', 'Cael', 'Caer', 'Ehl', 'Eld', 'Fael', 'Gal', 'Ith', 'Lir', 'Mael', 'Mir', 'Nael', 'Nil', 'Phal', 'Rael', 'Sil', 'Tael', 'Thal', 'Val', 'Vel', 'Xael', 'Ynd', 'Zel'],
    mid: ['a', 'ae', 'ael', 'an', 'ar', 'el', 'en', 'iel', 'il', 'ir', 'or', 'yl'],
    suf: ['ael', 'aer', 'anor', 'ath', 'eil', 'elar', 'ene', 'iel', 'ilor', 'ith', 'oril', 'rath', 'ril', 'thal', 'yn'],
  },
  dwarf: {
    pre: ['Bor', 'Brom', 'Dag', 'Drak', 'Dur', 'Erd', 'Fal', 'Gim', 'Glar', 'Gruk', 'Kor', 'Krag', 'Lok', 'Mog', 'Nor', 'Orf', 'Rad', 'Rak', 'Thag', 'Thor', 'Uld', 'Ulf', 'Vor', 'Wald'],
    mid: ['a', 'ak', 'al', 'ar', 'im', 'in', 'ok', 'or', 'ul', 'un'],
    suf: ['akir', 'amir', 'andin', 'ardur', 'erin', 'idur', 'ikin', 'imir', 'okhal', 'orkil', 'ulin', 'undur'],
  },
  halfling: {
    pre: ['Bil', 'Cot', 'Del', 'Elm', 'Fin', 'Gil', 'Hal', 'Ivyn', 'Jok', 'Kel', 'Lob', 'Mel', 'Nib', 'Ob', 'Pad', 'Pip', 'Rob', 'Saf', 'Tab', 'Tom', 'Wil'],
    mid: ['a', 'an', 'bo', 'do', 'ey', 'in', 'lo', 'o', 'ro', 'to'],
    suf: ['aldin', 'ambo', 'ando', 'ashin', 'awyn', 'ekin', 'elin', 'illo', 'imbo', 'inwyn', 'opin', 'orpin'],
  },
  gnome: {
    pre: ['Alz', 'Bim', 'Boz', 'Dim', 'Fiz', 'Giz', 'Nim', 'Pip', 'Pok', 'Quz', 'Rux', 'Siz', 'Snoz', 'Tiz', 'Tock', 'Wim', 'Zap', 'Zib', 'Zim', 'Zip'],
    mid: ['a', 'el', 'er', 'il', 'le', 'ock', 'ot', 'ri', 'ro', 'ul'],
    suf: ['abix', 'anik', 'elrix', 'erix', 'ilnix', 'ipock', 'irix', 'olbix', 'olvix', 'orix', 'ulnix', 'upix'],
  },
  orc: {
    pre: ['Ag', 'Bog', 'Brug', 'Drak', 'Garg', 'Gor', 'Grak', 'Grom', 'Grul', 'Grum', 'Krag', 'Krul', 'Mag', 'Mog', 'Morg', 'Rok', 'Rug', 'Thak', 'Throk', 'Ug', 'Vrak', 'Zog'],
    mid: ['a', 'ag', 'ak', 'ar', 'og', 'ok', 'or', 'ug', 'uk', 'ur'],
    suf: ['akur', 'ashnak', 'dur', 'garak', 'grakh', 'guthar', 'karag', 'kharnak', 'makur', 'nakar', 'nakur', 'rakh', 'rukar', 'tharak', 'turak'],
  },
};

const locationBanks = {
  city: {
    pre: ['Aeld', 'Aer', 'Alth', 'Bael', 'Caer', 'Chal', 'Dal', 'Dor', 'Eld', 'Elth', 'Fal', 'Gar', 'Ith', 'Kal', 'Lor', 'Mal', 'Mor', 'Nael', 'Nor', 'Oth', 'Pal', 'Ran', 'Sel', 'Tal', 'Thor', 'Val', 'Vel', 'Xal', 'Zan', 'Zor'],
    suf: ['ath', 'dael', 'dar', 'dor', 'eth', 'gar', 'gath', 'heim', 'ion', 'ith', 'mar', 'mor', 'nar', 'nia', 'nor', 'rath', 'rim', 'ron', 'roth', 'seth', 'shal', 'thal', 'than', 'tor', 'tyr', 'ul', 'val', 'var', 'vel', 'wyn'],
  },
  village: {
    pre: ['Aeln', 'Bael', 'Calh', 'Dael', 'Elh', 'Faer', 'Geln', 'Haer', 'Iln', 'Jael', 'Kaln', 'Lael', 'Meln', 'Nael', 'Oln', 'Pael', 'Raln', 'Seln', 'Tael', 'Uln', 'Valn', 'Weln', 'Yaln', 'Zaln'],
    suf: ['abar', 'adel', 'ahar', 'alar', 'amar', 'anar', 'aral', 'aran', 'arel', 'aron', 'athar', 'avar', 'edel', 'ehar', 'emar', 'enal', 'enar', 'eran', 'erel', 'eron'],
  },
  mountain: {
    pre: ['Agr', 'Brak', 'Drak', 'Durg', 'Frak', 'Grak', 'Grul', 'Grum', 'Ithk', 'Karg', 'Krak', 'Krul', 'Morg', 'Norg', 'Rak', 'Rok', 'Thrag', 'Thrak', 'Ulk', 'Urgr', 'Vrak', 'Zrak'],
    suf: ['adan', 'aghor', 'akhar', 'aldar', 'amar', 'amar', 'andar', 'andur', 'arag', 'arakh', 'ardur', 'arok', 'arug', 'athar', 'atur', 'azur', 'odar', 'odur', 'okhar', 'oldar', 'ondur', 'orak'],
  },
  river: {
    pre: ['Aeld', 'Ael', 'Caer', 'Cael', 'Dal', 'Eld', 'Elh', 'Fael', 'Gael', 'Ith', 'Lael', 'Lir', 'Mael', 'Nil', 'Oel', 'Pael', 'Rael', 'Sel', 'Sil', 'Tael', 'Vel', 'Vael', 'Xael', 'Zael'],
    suf: ['adel', 'aer', 'ahar', 'aiel', 'aith', 'anel', 'aner', 'anil', 'anor', 'arath', 'areth', 'arith', 'aryn', 'athal', 'athel', 'avel', 'aven', 'avir', 'awyn', 'edel', 'eiel', 'eith'],
  },
  forest: {
    pre: ['Aeld', 'Ael', 'Caer', 'Cael', 'Dael', 'Eld', 'Elh', 'Fael', 'Gael', 'Ith', 'Lael', 'Lir', 'Mael', 'Nael', 'Oel', 'Pael', 'Rael', 'Sel', 'Sil', 'Tael', 'Vel', 'Vael', 'Xael', 'Zael'],
    suf: ['adorn', 'aelor', 'aewyn', 'agorn', 'alath', 'aleth', 'alith', 'alorn', 'alwyn', 'aneth', 'anorn', 'anwyn', 'areth', 'arith', 'arorn', 'arwyn', 'athal', 'athel', 'athorn', 'avel', 'aveth', 'avorn', 'avwyn'],
  },
  dungeon: {
    pre: ['Agr', 'Brak', 'Drak', 'Durg', 'Frak', 'Grak', 'Grul', 'Grum', 'Ithk', 'Karg', 'Krak', 'Krul', 'Morg', 'Norg', 'Rak', 'Rok', 'Thrag', 'Thrak', 'Ulk', 'Urgr', 'Vrak', 'Zrak'],
    suf: ['adath', 'agath', 'akhar', 'alath', 'amoth', 'anath', 'arath', 'aroth', 'athar', 'athor', 'azath', 'azoth', 'odath', 'ogath', 'okhar', 'olath', 'omoth', 'onath', 'orath', 'oroth', 'othar', 'othor'],
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
  if (roll < 0.45) {
    return pick(b.pre) + pick(b.suf);
  } else if (roll < 0.75) {
    return pick(b.pre) + pick(b.mid) + pick(b.suf);
  } else {
    return pick(b.pre) + pick(b.suf);
  }
}

function generateLocationName(category: LocCategory): string {
  const b = locationBanks[category];
  const roll = Math.random();
  if (roll < 0.6) {
    return pick(b.pre) + pick(b.suf);
  } else {
    // two-part: pre1 + pre2 (shortened) + suf
    const p1 = pick(b.pre);
    const p2 = pick(b.pre).toLowerCase();
    return p1 + '\'' + p2 + pick(b.suf);
  }
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
