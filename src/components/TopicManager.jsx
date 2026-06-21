import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function TopicManager() {
  const { topics, addTopic, updateTopic, deleteTopic } = useStore();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    
    if (editingId) {
      updateTopic(editingId, { name });
      setEditingId(null);
    } else {
      addTopic({ name });
    }
    setName('');
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setName(t.name);
  };

  return (
    <div className="card">
      <h2>Quản lý Chủ đề (Topics)</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="VD: Flow, Lyrics, Độ ảnh hưởng..." 
          style={{ flex: 1 }}
          required 
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
          <Plus size={16} /> {editingId ? 'Sửa' : 'Thêm'}
        </button>
      </form>

      <div className="list">
        {topics.map(t => (
          <div key={t.id} className="list-item" style={{ padding: '8px 12px' }}>
            <span style={{ fontWeight: 500 }}>{t.name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleEdit(t)} className="btn" style={{ padding: '4px 8px' }}><Edit2 size={14} /></button>
              <button onClick={() => deleteTopic(t.id)} className="btn btn-danger" style={{ padding: '4px 8px' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
