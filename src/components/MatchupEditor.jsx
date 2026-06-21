import React from 'react';
import { useStore } from '../store';

export default function MatchupEditor() {
  const { rappers, topics, matchup, setMatchupRapper, setMatchupScore } = useStore();

  const getRapper = (id) => rappers.find(r => r.id === id);
  const rapperA = getRapper(matchup.rapperA);
  const rapperB = getRapper(matchup.rapperB);

  return (
    <div className="card">
      <h2>Thiết lập trận đấu (Matchup)</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <select 
            value={matchup.rapperA || ''} 
            onChange={(e) => setMatchupRapper('rapperA', e.target.value)}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <option value="">-- Chọn Rapper A --</option>
            {rappers.map(r => (
              <option key={r.id} value={r.id} disabled={r.id === matchup.rapperB}>{r.name}</option>
            ))}
          </select>
          {rapperA && <img src={rapperA.image} alt={rapperA.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />}
        </div>
        
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>VS</div>
        
        <div style={{ flex: 1, textAlign: 'center' }}>
          <select 
            value={matchup.rapperB || ''} 
            onChange={(e) => setMatchupRapper('rapperB', e.target.value)}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <option value="">-- Chọn Rapper B --</option>
            {rappers.map(r => (
              <option key={r.id} value={r.id} disabled={r.id === matchup.rapperA}>{r.name}</option>
            ))}
          </select>
          {rapperB && <img src={rapperB.image} alt={rapperB.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />}
        </div>
      </div>

      {rapperA && rapperB && topics.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1rem', textAlign: 'center' }}>Đánh giá (Scoring)</h3>
          {topics.map(t => {
            const score = matchup.scores[t.id];
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ flex: 1, fontWeight: 600 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    className={`btn ${score === 'A' ? 'btn-primary' : ''}`} 
                    onClick={() => setMatchupScore(t.id, 'A')}
                    style={{ padding: '6px 12px' }}
                  >
                    {rapperA.name}
                  </button>
                  <button 
                    className={`btn ${score === 'Tie' ? 'btn-primary' : ''}`} 
                    onClick={() => setMatchupScore(t.id, 'Tie')}
                    style={{ padding: '6px 12px' }}
                  >
                    Hòa
                  </button>
                  <button 
                    className={`btn ${score === 'B' ? 'btn-primary' : ''}`} 
                    onClick={() => setMatchupScore(t.id, 'B')}
                    style={{ padding: '6px 12px' }}
                  >
                    {rapperB.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
