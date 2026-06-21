import React from 'react';
import { useStore, saveAudioToDB, clearAudioFromDB } from '../store';
import { Upload, Trash2, Clock } from 'lucide-react';

export default function SoundManager() {
  const { activeAudio, setActiveAudio, setAudioBlobUrl } = useStore();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await saveAudioToDB(file);
      const url = URL.createObjectURL(file);
      setAudioBlobUrl(url); // Also update the global URL
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setActiveAudio({ src: url, name: file.name, duration: audio.duration, start: 0, end: audio.duration });
      });
    }
  };

  const clearAudio = async () => {
    await clearAudioFromDB();
    setActiveAudio(null);
    setAudioBlobUrl(null);
  };

  return (
    <div className="card">
      <h2>Âm thanh nền (Background Audio)</h2>
      
      {!activeAudio ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Thêm âm thanh nền để phát trong lúc xem trước và xuất video.</p>
          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Upload size={16} /> Chọn File Âm thanh (MP3/WAV)
            <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div className="list-item" style={{ border: '1px solid var(--primary)', flexDirection: 'column', alignItems: 'stretch', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Đang sử dụng: {activeAudio.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Độ dài: {activeAudio.duration.toFixed(1)}s
              </div>
            </div>
            <button onClick={clearAudio} className="btn btn-danger" style={{ padding: '8px' }}>
              <Trash2 size={16} /> Gỡ bỏ
            </button>
          </div>
          
          <div className="control-group" style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <Clock size={14} /> Cắt khoảng phát âm thanh
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bắt đầu từ (s):</label>
                <input 
                  type="number" 
                  value={activeAudio.start || 0} 
                  onChange={e => setActiveAudio({ ...activeAudio, start: Number(e.target.value) })} 
                  min={0} 
                  max={activeAudio.end || activeAudio.duration} 
                  step="0.1" 
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kết thúc ở (s):</label>
                <input 
                  type="number" 
                  value={activeAudio.end || activeAudio.duration} 
                  onChange={e => setActiveAudio({ ...activeAudio, end: Number(e.target.value) })} 
                  min={activeAudio.start || 0} 
                  max={activeAudio.duration} 
                  step="0.1" 
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </div>
            </div>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
              Mẹo: Âm thanh sẽ dừng lại theo thiết lập này hoặc khi video kết thúc.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
