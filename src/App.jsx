import React, { useState, useEffect } from 'react';
import { useStore, loadAudioFromDB } from './store';
import RapperManager from './components/RapperManager';
import TierListManager from './components/TierListManager';
import SoundManager from './components/SoundManager';
import { TierListPool } from './components/TierListEditor';
import ExportManager from './components/ExportManager';
import AdminManager from './components/AdminManager';
import { Download, Upload } from 'lucide-react';

function BackupData() {
  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h2>Sao lưu và Khôi phục Dữ liệu</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Dữ liệu của bạn được lưu cục bộ trên trình duyệt. Để chuyển sang điện thoại hoặc chia sẻ cho người khác, bạn hãy xuất file ở máy này và nhập file ở máy khác.</p>
      
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => {
          const data = localStorage.getItem('rap-ranker-storage');
          if (!data) return alert("Không có dữ liệu để xuất");
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'rap_ranker_backup.json';
          a.click();
        }}>
          <Download size={16} /> Tải file Sao lưu (.json)
        </button>
        
        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={16} /> Nhập file Khôi phục (.json)
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                JSON.parse(event.target.result); // validate JSON
                localStorage.setItem('rap-ranker-storage', event.target.result);
                alert("Khôi phục thành công! Trang sẽ tự động tải lại.");
                window.location.reload();
              } catch (err) {
                alert("File không hợp lệ!");
              }
            };
            reader.readAsText(file);
          }} />
        </label>
      </div>
    </div>
  );
}

function AuthScreen() {
  const { login, register, users } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const success = login(identifier, password);
      if (!success) setError('Sai tài khoản hoặc mật khẩu');
    } else {
      const exists = users.some(u => u.username === username || u.email === email);
      if (exists) {
        setError('Tên người dùng hoặc email đã tồn tại');
        return;
      }
      register({ email, username, fullName, password });
      setIsLogin(true);
      setError('Đăng ký thành công! Vui lòng đăng nhập.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
      <div className="card" style={{ width: '400px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px', textAlign: 'center' }}>Rap Ranker</h1>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
          {isLogin ? 'Đăng nhập để lưu lại các thay đổi của bạn' : 'Tạo tài khoản mới'}
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isLogin ? (
            <>
              <input 
                type="text" 
                placeholder="Email hoặc Tên người dùng..." 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="Mật khẩu..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          ) : (
            <>
              <input type="email" placeholder="Email..." value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="text" placeholder="Tên người dùng (Username)..." value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="text" placeholder="Họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input type="password" placeholder="Mật khẩu..." value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </>
          )}
          
          <button type="submit" className="btn btn-primary">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          </span>
          <button 
            className="btn" 
            style={{ display: 'inline-block', padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--primary)' }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryView() {
  const { history, currentUser } = useStore();
  const userHistory = history.filter(h => h.userId === currentUser?.id);

  if (userHistory.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Chưa có lịch sử hoạt động nào.</div>;
  }

  return (
    <div className="card">
      <h2>Lịch sử hoạt động</h2>
      <div className="list">
        {userHistory.map(h => (
          <div key={h.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <div style={{ fontWeight: 600 }}>{h.action}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.details}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(h.date).toLocaleString('vi-VN')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const { currentUser, logout, videoSettings, setVideoSetting, activeAudio, audioBlobUrl, setAudioBlobUrl } = useStore();
  const [activeTab, setActiveTab] = useState('matchup');

  useEffect(() => {
    if (activeAudio && !audioBlobUrl) {
      loadAudioFromDB().then(blob => {
        if (blob) {
          setAudioBlobUrl(URL.createObjectURL(blob));
        }
      });
    }
  }, [activeAudio, audioBlobUrl, setAudioBlobUrl]);

  return (
    <div className="app-container">
      {/* Sidebar for settings */}
      <div className="sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Rap Ranker</h1>
          {currentUser && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Xin chào, {currentUser.username || currentUser.email}</span>
            </div>
          )}
        </div>
        
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          <div className={`tab ${activeTab === 'matchup' ? 'active' : ''}`} onClick={() => setActiveTab('matchup')}>Tier List</div>
          <div className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>Cấu hình Bảng</div>
          <div className={`tab ${activeTab === 'rappers' ? 'active' : ''}`} onClick={() => setActiveTab('rappers')}>Rappers</div>
          <div className={`tab ${activeTab === 'sounds' ? 'active' : ''}`} onClick={() => setActiveTab('sounds')}>Âm thanh</div>
          {currentUser?.role === 'admin' && (
            <div className={`tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{ color: 'var(--danger)' }}>Quản trị Data Gốc</div>
          )}
          <div className={`tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>Tài khoản</div>
        </div>

        {/* Global Video Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="control-group" style={{ margin: 0, flex: 1 }}>
              <label>Font chữ</label>
              <select value={videoSettings.font} onChange={(e) => setVideoSetting('font', e.target.value)}>
                <option value="Inter">Inter (Hiện đại)</option>
                <option value="Roboto">Roboto</option>
                <option value="Arial">Arial</option>
                <option value="Courier New">Courier New (Cổ điển)</option>
                <option value="Comic Sans MS">Comic Sans (Vui nhộn)</option>
              </select>
            </div>
            <div className="control-group" style={{ margin: 0, flex: 1 }}>
              <label>Thời lượng 1 bảng (s)</label>
              <input 
                type="number" 
                value={videoSettings.durationPerList} 
                onChange={(e) => setVideoSetting('durationPerList', Math.max(1, Number(e.target.value)))} 
                min={1}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="control-group" style={{ margin: 0, flex: 1 }}>
              <label>Hiệu ứng nổi (Particle Effect)</label>
              <select value={videoSettings.effect || 'particles'} onChange={(e) => setVideoSetting('effect', e.target.value)}>
                <option value="particles">Hạt lơ lửng (Mặc định)</option>
                <option value="snow">Tuyết rơi</option>
                <option value="matrix">Ma trận (Matrix xanh)</option>
                <option value="none">Không có (Tắt)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'matchup' && <TierListPool />}
          {activeTab === 'topics' && <TierListManager />}
          {activeTab === 'rappers' && <RapperManager />}
          {activeTab === 'sounds' && <SoundManager />}
          {activeTab === 'admin' && <AdminManager />}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {currentUser ? (
                <>
                  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{currentUser.fullName}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentUser.email}</p>
                    </div>
                    <button onClick={logout} className="btn btn-danger">Đăng xuất</button>
                  </div>
                  <HistoryView />
                </>
              ) : (
                <AuthScreen />
              )}
              <BackupData />
            </div>
          )}
        </div>
      </div>

      {/* Main content for preview */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '20px' }}>
        <ExportManager />
      </div>
    </div>
  );
}

export default App;
