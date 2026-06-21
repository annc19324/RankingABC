import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

export default function TierListManager() {
  const { 
    tierLists, addTierList, updateTierList, deleteTierList, 
    addTier, updateTier, deleteTier 
  } = useStore();
  
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [expandedListId, setExpandedListId] = useState(null);

  const handleAddList = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (editingId) {
      updateTierList(editingId, name);
      setEditingId(null);
    } else {
      addTierList(name);
    }
    setName('');
  };

  const handleEditList = (tl) => {
    setEditingId(tl.id);
    setName(tl.name);
  };

  const toggleExpand = (id) => {
    setExpandedListId(expandedListId === id ? null : id);
  };

  return (
    <div className="card">
      <h2>Cấu hình Bảng Xếp Hạng</h2>
      
      <form onSubmit={handleAddList} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Tên bảng (VD: Kỹ năng, Fame...)" 
          style={{ flex: 1 }}
          required 
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
          <Plus size={16} /> {editingId ? 'Sửa' : 'Thêm Bảng'}
        </button>
      </form>

      <div className="list">
        {tierLists.map(tl => (
          <div key={tl.id} style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            
            {/* List Header */}
            <div className="list-item" style={{ border: 'none', margin: 0, background: 'transparent' }}>
              <span style={{ fontWeight: 600, flex: 1, cursor: 'pointer' }} onClick={() => toggleExpand(tl.id)}>
                {tl.name}
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => toggleExpand(tl.id)} className="btn" style={{ padding: '4px 8px' }}>
                  {expandedListId === tl.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={() => handleEditList(tl)} className="btn" style={{ padding: '4px 8px' }}><Edit2 size={14} /></button>
                {tierLists.length > 1 && (
                  <button onClick={() => deleteTierList(tl.id)} className="btn btn-danger" style={{ padding: '4px 8px' }}><Trash2 size={14} /></button>
                )}
              </div>
            </div>

            {/* Tiers Editor */}
            {expandedListId === tl.id && (
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Các Bậc Hạng (Tiers)</h4>
                
                {tl.tiers.map(tier => (
                  <div key={tier.id} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={tier.color}
                      onChange={(e) => updateTier(tl.id, tier.id, tier.label, e.target.value)}
                      style={{ width: '40px', height: '35px', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={tier.label}
                      onChange={(e) => updateTier(tl.id, tier.id, e.target.value, tier.color)}
                      style={{ flex: 1, padding: '6px 10px' }}
                    />
                    <button onClick={() => deleteTier(tl.id, tier.id)} className="btn btn-danger" style={{ padding: '8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button 
                  onClick={() => addTier(tl.id, 'New Tier', '#cccccc')} 
                  className="btn" 
                  style={{ width: '100%', marginTop: '10px', fontSize: '0.85rem' }}
                >
                  <Plus size={14} /> Thêm Bậc
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
