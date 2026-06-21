import React from 'react';
import { useStore } from '../store';

const handleDragStart = (e, rapperId, sourceListId) => {
  e.dataTransfer.setData('rapperId', rapperId);
  e.dataTransfer.setData('sourceListId', sourceListId);
};

const handleDragOver = (e) => {
  e.preventDefault();
};

export function TierListPool() {
  const { rappers, tierLists, moveRapperToTier } = useStore();

  const handleDrop = (e, targetListId, tierId) => {
    e.preventDefault();
    const rapperId = e.dataTransfer.getData('rapperId');
    const sourceListId = e.dataTransfer.getData('sourceListId');
    
    if (rapperId && sourceListId === targetListId) {
      moveRapperToTier(rapperId, targetListId, tierId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {tierLists.map((tl) => {
        const assignedIds = new Set(tl.tiers.flatMap(t => t.items));
        const unassignedRappers = rappers.filter(r => !assignedIds.has(r.id));

        return (
          <div key={tl.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0 }}>Kho chờ: {tl.name}</h2>
            
            <div 
              style={{ minHeight: '300px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '2px dashed rgba(255,255,255,0.2)' }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tl.id, 'pool')}
            >
              <h3 style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Kéo Rapper từ bên phải về đây để gỡ khỏi bảng</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {unassignedRappers.map(rapper => (
                  <div 
                    key={rapper.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, rapper.id, tl.id)}
                    style={{ cursor: 'grab', width: '70px', height: '70px', position: 'relative', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}
                    title={rapper.name}
                  >
                    {rapper.image ? <img src={rapper.image} alt={rapper.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>{rapper.name?.[0] || '?'}</div>}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', fontSize: '0.6rem', textAlign: 'center', padding: '2px' }}>
                      {rapper.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TierListBoard({ logicalWidth, logicalHeight }) {
  const { rappers, tierLists, moveRapperToTier, videoSettings } = useStore();
  
  const handleDrop = (e, targetListId, tierId) => {
    e.preventDefault();
    const rapperId = e.dataTransfer.getData('rapperId');
    const sourceListId = e.dataTransfer.getData('sourceListId');
    
    if (rapperId && sourceListId === targetListId) {
      moveRapperToTier(rapperId, targetListId, tierId);
    }
  };

  const font = videoSettings.font || 'Inter';
  
  const isPreview = !!logicalWidth;
  const previewCols = Math.max(1, tierLists.length);
  
  // Mathematical parity with CanvasRenderer when logicalWidth is provided
  const paddingPx = isPreview ? Math.floor(logicalWidth * 0.02) : 10;
  const colWidthPx = isPreview ? Math.floor(logicalWidth / previewCols) : null;
  const listWidthPx = isPreview ? colWidthPx - paddingPx * 2 : null;
  
  const startYPx = isPreview ? Math.floor(logicalHeight * 0.12) : null;
  const maxAvailableHeightPx = isPreview ? logicalHeight - startYPx - Math.floor(logicalHeight * 0.05) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, tierLists.length)}, 1fr)`, gap: '0px', width: '100%', height: isPreview ? '100%' : 'auto', background: 'transparent', borderRadius: '8px', overflow: 'hidden', border: isPreview ? 'none' : '2px solid rgba(255,255,255,0.1)' }}>
      {tierLists.map((tl, idx) => {
        const rowHeightPx = isPreview ? Math.floor(maxAvailableHeightPx / Math.max(1, tl.tiers.length)) : 150;
        const labelWidthPx = isPreview ? Math.floor(Math.min(listWidthPx * 0.15, rowHeightPx * 1.5)) : 100;
        const gapPx = isPreview ? Math.floor(Math.min(rowHeightPx * 0.05, 10)) : 6;
        
        const maxImgSizePx = isPreview ? Math.floor(logicalWidth * 0.23) : 120;
        const imgSizePx = isPreview ? Math.floor(Math.min(rowHeightPx - (rowHeightPx * 0.1), maxImgSizePx)) : 120;
        const titleFontSizePx = isPreview ? Math.floor(logicalHeight * 0.04) : 32;

        return (
        <div key={tl.id} style={{ display: 'flex', flexDirection: 'column', padding: `${paddingPx}px`, paddingBottom: 0, borderLeft: idx > 0 ? '2px solid rgba(255,255,255,0.2)' : 'none' }}>
          <div style={{ height: isPreview ? `${startYPx}px` : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ textAlign: 'center', margin: 0, fontFamily: font, fontSize: `${titleFontSizePx}px`, whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{tl.name}</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${gapPx}px`, flex: 1, height: isPreview ? `${maxAvailableHeightPx}px` : 'auto' }}>
            {tl.tiers.map(tier => (
              <div 
                key={tier.id} 
                className="tier-row"
                data-tier-id={tier.id}
                style={{ display: 'flex', height: isPreview ? `${rowHeightPx}px` : 'min-content', minHeight: isPreview ? `${rowHeightPx}px` : '150px', background: 'rgba(26,26,26,0.8)', border: '2px solid #000' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tl.id, tier.id)}
              >
                {/* Label */}
                <div 
                  className="tier-label"
                  style={{ 
                    width: `${labelWidthPx}px`, 
                    background: tier.color, 
                    color: '#000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: `${Math.floor(Math.min(labelWidthPx, rowHeightPx) * 0.4)}px`,
                    fontFamily: font
                  }}>
                  {tier.label}
                </div>
                
                {/* Items Container */}
                <div className="tier-items" style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: `${gapPx}px`, padding: `${gapPx}px`, alignContent: 'flex-start' }}>
                  {tier.items.map(itemId => {
                    const rapper = rappers.find(r => r.id === itemId);
                    if (!rapper) return null;
                    
                    const nameBgHeightPx = Math.max(16, imgSizePx * 0.25);
                    const nameFontSizePx = Math.max(12, Math.floor(nameBgHeightPx * 0.7));

                    return (
                      <div 
                        key={rapper.id}
                        className="tier-item"
                        data-item-id={rapper.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, rapper.id, tl.id)}
                        style={{ cursor: 'grab', width: `${imgSizePx}px`, display: 'flex', flexDirection: 'column' }}
                        title={rapper.name}
                      >
                        <div style={{ width: `${imgSizePx}px`, height: `${imgSizePx}px`, position: 'relative' }}>
                          {rapper.image ? <img src={rapper.image} alt={rapper.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: '#fff', fontSize: `${imgSizePx/2}px`, fontWeight: 'bold' }}>{rapper.name?.[0] || '?'}</div>}
                        </div>
                        <div style={{ fontSize: `${nameFontSizePx}px`, textAlign: 'center', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: `-${nameBgHeightPx}px`, zIndex: 1, position: 'relative', height: `${nameBgHeightPx}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {rapper.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
