import { create } from 'zustand';
import type { Project, Layer, Racer, TextLayer } from '../types';
import { createTemplate, initialRacer, templates, uid } from '../catalog/templates';
import { baseStyle } from '../catalog/effects';
import { readAutosave } from '../lib/project';
interface Store {
  project: Project;
  selection: string[];
  past: Project[];
  future: Project[];
  notice: string;
  saveStatus: string;
  setNotice: (s: string) => void;
  select: (ids: string[]) => void;
  commit: (fn: (p: Project) => void) => void;
  load: (p: Project) => void;
  undo: () => void;
  redo: () => void;
  updateLayers: (ids: string[], patch: Partial<Layer>) => void;
  add: (l: Layer) => void;
  remove: () => void;
  duplicate: () => void;
  order: (mode: 'front' | 'back' | 'up' | 'down') => void;
  group: () => void;
  ungroup: () => void;
  align: (mode: 'centerX' | 'centerY' | 'left' | 'right' | 'top' | 'bottom') => void;
  setRacer: (patch: Partial<Racer>) => void;
  addText: () => void;
  setSaveStatus: (s: string) => void;
}
export const useEditor = create<Store>((set, get) => ({
  project: readAutosave() || createTemplate(templates[2], initialRacer),
  selection: [],
  past: [],
  future: [],
  notice: '',
  saveStatus: '自動保存',
  setNotice: (notice) => set({ notice }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  select: (selection) => set({ selection }),
  commit: (fn) => {
    const { project, past } = get(),
      next = structuredClone(project);
    fn(next);
    next.updatedAt = new Date().toISOString();
    set({ project: next, past: [...past.slice(-59), project], future: [] });
  },
  load: (p) => {
    get().commit((d) => Object.assign(d, structuredClone(p)));
    set({ selection: [] });
  },
  undo: () => {
    const { past, project, future } = get();
    if (past.length)
      set({
        project: past[past.length - 1],
        past: past.slice(0, -1),
        future: [project, ...future],
        selection: [],
      });
  },
  redo: () => {
    const { past, project, future } = get();
    if (future.length)
      set({ project: future[0], past: [...past, project], future: future.slice(1), selection: [] });
  },
  updateLayers: (ids, patch) =>
    get().commit((p) => {
      p.layers = p.layers.map((l) =>
        ids.includes(l.id) && !l.locked ? ({ ...l, ...patch } as Layer) : l,
      );
    }),
  add: (l) => {
    if (get().project.layers.length >= 250) {
      get().setNotice('レイヤーは250個までです。');
      return;
    }
    get().commit((p) => {
      p.layers.push(l);
    });
    set({ selection: [l.id] });
  },
  remove: () => {
    const ids = get().selection;
    get().commit((p) => {
      p.layers = p.layers.filter((l) => !ids.includes(l.id) || l.locked);
    });
    set({ selection: [] });
  },
  duplicate: () => {
    if (
      get().project.layers.length +
        get().project.layers.filter((l) => get().selection.includes(l.id)).length >
      250
    ) {
      get().setNotice('レイヤーは250個までです。');
      return;
    }
    const ids = get().selection,
      newIds: string[] = [],
      groups = new Map<string, string>();
    get().commit((p) => {
      const copies = p.layers
        .filter((l) => ids.includes(l.id))
        .map((l) => {
          const id = uid();
          newIds.push(id);
          if (l.groupId && !groups.has(l.groupId)) groups.set(l.groupId, uid());
          return {
            ...l,
            id,
            x: l.x + 12,
            y: l.y + 8,
            locked: false,
            groupId: l.groupId ? groups.get(l.groupId) : undefined,
          };
        });
      p.layers.push(...copies);
    });
    set({ selection: newIds });
  },
  order: (mode) => {
    const ids = get().selection;
    get().commit((p) => {
      if (mode === 'front' || mode === 'back') {
        const a = p.layers.filter((l) => ids.includes(l.id)),
          b = p.layers.filter((l) => !ids.includes(l.id));
        p.layers = mode === 'front' ? [...b, ...a] : [...a, ...b];
      } else if (mode === 'up') {
        for (let i = p.layers.length - 2; i >= 0; i--)
          if (ids.includes(p.layers[i].id) && !ids.includes(p.layers[i + 1].id))
            [p.layers[i], p.layers[i + 1]] = [p.layers[i + 1], p.layers[i]];
      } else
        for (let i = 1; i < p.layers.length; i++)
          if (ids.includes(p.layers[i].id) && !ids.includes(p.layers[i - 1].id))
            [p.layers[i], p.layers[i - 1]] = [p.layers[i - 1], p.layers[i]];
    });
  },
  group: () => {
    const ids = get().selection,
      id = uid();
    if (ids.length < 2) return;
    get().commit((p) => {
      p.layers.forEach((l) => {
        if (ids.includes(l.id) && !l.locked) l.groupId = id;
      });
    });
  },
  ungroup: () => {
    const ids = get().selection;
    get().commit((p) => {
      p.layers.forEach((l) => {
        if (ids.includes(l.id) && !l.locked) delete l.groupId;
      });
    });
  },
  align: (mode) => {
    const ids = get().selection;
    get().commit((p) => {
      p.layers.forEach((l) => {
        if (!ids.includes(l.id) || l.locked) return;
        const w = l.width * l.scaleX,
          h = l.height * l.scaleY;
        if (mode === 'centerX') l.x = (960 - w) / 2;
        if (mode === 'centerY') l.y = (192 - h) / 2;
        if (mode === 'left') l.x = 12;
        if (mode === 'right') l.x = 948 - w;
        if (mode === 'top') l.y = 12;
        if (mode === 'bottom') l.y = 180 - h;
      });
    });
  },
  setRacer: (patch) =>
    get().commit((p) => {
      Object.assign(p.racer, patch);
      p.layers.forEach((l) => {
        if (l.type === 'text' && l.binding && patch[l.binding] !== undefined)
          l.text = patch[l.binding]!;
      });
    }),
  addText: () => {
    const l: TextLayer = {
      id: uid(),
      name: '自由テキスト',
      type: 'text',
      text: '応援のことば',
      x: 280,
      y: 74,
      width: 400,
      height: 50,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      flipped: false,
      fontFamily: 'Noto Sans JP',
      fontSize: 32,
      align: 'center',
      style: { ...baseStyle },
    };
    get().add(l);
  },
}));
let timer: ReturnType<typeof setTimeout>;
useEditor.subscribe((state, prev) => {
  if (state.project === prev.project) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem('boat-studio-autosave', JSON.stringify(state.project));
      state.setSaveStatus('自動保存済み');
    } catch {
      state.setSaveStatus('保存容量不足');
      state.setNotice(
        'ブラウザーの保存容量が不足しています。JSONを書き出してデータを保管してください。',
      );
    }
  }, 550);
});
