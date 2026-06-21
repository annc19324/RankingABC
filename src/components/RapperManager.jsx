import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2, Upload, RefreshCcw, Check, X } from 'lucide-react';

export default function RapperManager() {
  const store = useStore();
  const rappersList = store.rappers || [];
  
  // States for Adding new rapper
  const [addName, setAddName] = useState('');
  const [addImage, setAddImage] = useState('');

  // States for Editing existing rapper
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');

  const handleAddImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddImage(URL.createObjectURL(file));
    }
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(URL.createObjectURL(file));
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addName) return;
    store.addRapper({ name: addName, image: addImage });
    setAddName('');
    setAddImage('');
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditImage(r.image || '');
  };

  const handleUpdate = () => {
    if (!editName) return;
    store.updateRapper(editingId, { name: editName, image: editImage });
    setEditingId(null);
  };

  const handleDelete = (id) => {
    store.deleteRapper(id);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Quản lý Rapper cá nhân</h2>
        <button onClick={store.restoreDefaultRappers} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <RefreshCcw size={14} /> Khôi phục dữ liệu gốc
        </button>
      </div>

      <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="control-group">
          <label>Tên Rapper mới</label>
          <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Nhập tên rapper..." />
        </div>
        
        <div className="control-group">
          <label>Hình ảnh (URL hoặc Upload)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={addImage} onChange={e => setAddImage(e.target.value)} placeholder="Nhập URL ảnh..." style={{ flex: 1 }} />
            <label className="btn" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <input type="file" accept="image/*" onChange={handleAddImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {addImage && <img src={addImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
        
        <button type="submit" className="btn btn-primary" disabled={!addName}>
          <Plus size={16} /> Thêm Rapper
        </button>
      </form>

      <div className="list">
        {rappersList.map(r => (
          editingId === r.id ? (
            <div key={r.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)' }}>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Tên rapper..." style={{ width: '100%' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={editImage} onChange={e => setEditImage(e.target.value)} placeholder="URL ảnh..." style={{ flex: 1 }} />
                <label className="btn" style={{ cursor: 'pointer' }}>
                  <Upload size={16} />
                  <input type="file" accept="image/*" onChange={handleEditImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {editImage && <img src={editImage} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button onClick={handleUpdate} className="btn btn-primary" style={{ flex: 1 }}><Check size={16} /> Lưu</button>
                <button onClick={() => setEditingId(null)} className="btn" style={{ flex: 1 }}><X size={16} /> Hủy</button>
              </div>
            </div>
          ) : (
            <div key={r.id} className="list-item">
              <div className="list-item-content">
                {r.image ? <img src={r.image} alt={r.name} className="avatar" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>{r.name?.[0] || '?'}</div>}
                <strong>{r.name}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(r)} className="btn" style={{ padding: '6px' }}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: '6px' }}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
