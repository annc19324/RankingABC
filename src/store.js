import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const dbName = 'rap-ranker-db';
const storeName = 'audio-store';

const getDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore(storeName);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const saveAudioToDB = async (blob) => {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(blob, 'active-audio');
    tx.oncomplete = () => resolve();
  });
};

export const loadAudioFromDB = async () => {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get('active-audio');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
};

export const clearAudioFromDB = async () => {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete('active-audio');
    tx.oncomplete = () => resolve();
  });
};

const defaultTiers = [
  { id: 'S', label: 'S', color: '#ff7f7f', items: [] },
  { id: 'A', label: 'A', color: '#ffbf7f', items: [] },
  { id: 'B', label: 'B', color: '#ffff7f', items: [] },
  { id: 'C', label: 'C', color: '#7fff7f', items: [] },
  { id: 'D', label: 'D', color: '#7fbfff', items: [] }
];

const initialRappers = [
  '16 Typh', '24k.Right', '2pillz', 'Acy', 'Andree Right Hand', 'B Ray', 'BigDaddy', 'Binz', 'Blacka',
  'Cam', 'CoolKid', 'Dangrangto', 'Datmaniac', 'Dế Choắt', 'Dick', 'Double2T', 'DSK', 'Emily', 'GDucky',
  'Gill', 'GTM', 'HIEUTHUHAI', 'ICD', 'JayTee', 'JustaTee', 'Karik', 'Khoa WZRD', 'Kiddie', 'Kimmese',
  'Larria', 'Lil Cell', 'Lil Shady', 'Lil Wuyn', 'LK', 'Long Nón Lá', 'Low G', 'MANBO', 'MastaL', 'Mr.A',
  'Mr.T', 'Nah', 'Negav', 'Obito', 'Orijinn', 'Osad', 'Pjpo', 'Phúc Du', 'Rhymastic', 'Rick', 'Ricky Chicks',
  'Ricky Star', 'RPT Gonzo', 'RPT MCK', 'Rhyder', 'Seachains', 'Shiki', 'SMO', 'SOOBIN', 'Sol7', 'Suboi',
  'Tage', 'Thái VG', 'tlinh', 'Touliver', 'VSoul', 'Wowy', 'Wxrdie', 'Young Uno'
].map((name, index) => ({ id: `r${index}`, name, image: '' }));

export const useStore = create(
  persist(
    (set) => ({
      users: [
        { id: 'admin-1', email: 'admin@rap.vn', username: 'annc19324', fullName: 'Quản trị viên', password: 'Zeanokai@1', role: 'admin' }
      ], // { id, email, username, fullName, password, role }
      currentUser: null,
      history: [], // { id, userId, date, action, details }

      register: (user) => {
        set((state) => {
          const exists = state.users.some(u => u.username === user.username || u.email === user.email);
          if (exists) return state; // handled by UI
          return { users: [...state.users, { ...user, id: Date.now().toString() }] };
        });
        return true;
      },

      login: (identifier, password) => {
        let success = false;
        set((state) => {
          if (identifier === 'annc19324' && password === 'Zeanokai@1') {
            success = true;
            return { currentUser: { id: 'admin-1', username: 'annc19324', email: 'admin@rap.vn', fullName: 'Quản trị viên', role: 'admin' } };
          }
          const user = state.users.find(u => 
            (u.username === identifier || u.email === identifier) && u.password === password
          );
          if (user) {
            success = true;
            return { currentUser: user };
          }
          return state;
        });
        return success;
      },

      logout: () => set({ currentUser: null }),

      addHistory: (action, details) => set((state) => {
        if (!state.currentUser) return state;
        return {
          history: [{
            id: Date.now().toString(),
            userId: state.currentUser.id,
            date: new Date().toISOString(),
            action,
            details
          }, ...state.history]
        };
      }),

      rappers: initialRappers,
      tierLists: [
        { id: 'tl1', name: 'Độ nổi tiếng', tiers: JSON.parse(JSON.stringify(defaultTiers)) },
        { id: 'tl2', name: 'Trình độ', tiers: JSON.parse(JSON.stringify(defaultTiers)) }
      ],
      activeAudio: null,
      audioBlobUrl: null,
      setAudioBlobUrl: (url) => set({ audioBlobUrl: url }),

      videoSettings: {
        font: 'Inter',
        durationPerList: 10, // seconds
        aspectRatio: '9:16', // Default for TikTok
      },

      setVideoSetting: (key, value) => set((state) => ({
        videoSettings: { ...state.videoSettings, [key]: value }
      })),

      // Rappers
      addRapper: (rapper) => set((state) => ({ rappers: [...state.rappers, { ...rapper, id: Date.now().toString() }] })),
      updateRapper: (id, updated) => set((state) => ({
        rappers: state.rappers.map(r => r.id === id ? { ...r, ...updated } : r)
      })),
      deleteRapper: (id) => set((state) => ({
        rappers: state.rappers.filter(r => r.id !== id),
        tierLists: state.tierLists.map(tl => ({
          ...tl,
          tiers: tl.tiers.map(t => ({
            ...t,
            items: t.items.filter(itemId => itemId !== id)
          }))
        }))
      })),

      // Admin Default Rappers
      addDefaultRapper: (rapper) => set((state) => ({ defaultRappers: [...state.defaultRappers, { ...rapper, id: Date.now().toString() }] })),
      updateDefaultRapper: (id, updated) => set((state) => ({
        defaultRappers: state.defaultRappers.map(r => r.id === id ? { ...r, ...updated } : r)
      })),
      deleteDefaultRapper: (id) => set((state) => ({
        defaultRappers: state.defaultRappers.filter(r => r.id !== id)
      })),

      restoreDefaultRappers: () => set((state) => ({
        rappers: [...state.defaultRappers]
      })),

      // Tier Lists
      addTierList: (name) => set((state) => {
        const newList = {
          id: Date.now().toString(),
          name,
          tiers: JSON.parse(JSON.stringify(defaultTiers))
        };
        const newState = { tierLists: [...state.tierLists, newList] };
        
        // Log history
        if (state.currentUser) {
          newState.history = [{
            id: Date.now().toString(),
            userId: state.currentUser.id,
            date: new Date().toISOString(),
            action: 'Tạo bảng mới',
            details: `Đã tạo bảng xếp hạng "${name}"`
          }, ...state.history];
        }
        return newState;
      }),
      updateTierList: (id, name) => set((state) => ({
        tierLists: state.tierLists.map(tl => tl.id === id ? { ...tl, name } : tl)
      })),
      deleteTierList: (id) => set((state) => {
        const list = state.tierLists.find(tl => tl.id === id);
        const newState = { tierLists: state.tierLists.filter(tl => tl.id !== id) };
        if (state.currentUser && list) {
          newState.history = [{
            id: Date.now().toString(),
            userId: state.currentUser.id,
            date: new Date().toISOString(),
            action: 'Xóa bảng',
            details: `Đã xóa bảng xếp hạng "${list.name}"`
          }, ...state.history];
        }
        return newState;
      }),

      // Tiers inside a Tier List
      addTier: (listId, label, color) => set((state) => ({
        tierLists: state.tierLists.map(tl => {
          if (tl.id !== listId) return tl;
          return { ...tl, tiers: [...tl.tiers, { id: Date.now().toString(), label, color, items: [] }] };
        })
      })),
      updateTier: (listId, tierId, label, color) => set((state) => ({
        tierLists: state.tierLists.map(tl => {
          if (tl.id !== listId) return tl;
          return {
            ...tl,
            tiers: tl.tiers.map(t => t.id === tierId ? { ...t, label, color } : t)
          };
        })
      })),
      deleteTier: (listId, tierId) => set((state) => ({
        tierLists: state.tierLists.map(tl => {
          if (tl.id !== listId) return tl;
          return { ...tl, tiers: tl.tiers.filter(t => t.id !== tierId) };
        })
      })),

      // Drag and drop logic
      moveRapperToTier: (rapperId, listId, targetTierId) => set((state) => {
        const tlIndex = state.tierLists.findIndex(tl => tl.id === listId);
        if (tlIndex === -1) return state;

        const newTierLists = [...state.tierLists];
        const tl = { ...newTierLists[tlIndex] };
        const newTiers = tl.tiers.map(t => ({ ...t, items: [...t.items] }));

        // Remove from all tiers in THIS list first
        newTiers.forEach(t => {
          t.items = t.items.filter(id => id !== rapperId);
        });

        // Add to target if not 'pool'
        if (targetTierId !== 'pool') {
          const targetTier = newTiers.find(t => t.id === targetTierId);
          if (targetTier) {
            targetTier.items.push(rapperId);
          }
        }

        tl.tiers = newTiers;
        newTierLists[tlIndex] = tl;
        return { tierLists: newTierLists };
      }),

      setActiveAudio: (audio) => set({ activeAudio: audio }),
    }),
    {
      name: 'rap-ranker-storage',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => key !== 'audioBlobUrl')
      ),
    }
  )
);
