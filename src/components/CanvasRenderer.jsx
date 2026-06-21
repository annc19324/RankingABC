import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useStore } from '../store';

const CanvasRenderer = forwardRef(({ width = 1920, height = 1080, previewTime = 0, isExporting = false }, ref) => {
  const canvasRef = useRef(null);
  const { rappers, tierLists, videoSettings } = useStore();
  const [images, setImages] = useState({});

  // Load images
  useEffect(() => {
    const loadImg = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const loadAll = async () => {
      const newImages = {};
      for (const rapper of rappers) {
        if (rapper.image) {
          newImages[rapper.id] = await loadImg(rapper.image);
        }
      }
      setImages(newImages);
    };

    loadAll();
  }, [rappers]);

  const drawFrame = (ctx, time) => {
    // Draw background with cool gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f1c2e');
    bgGradient.addColorStop(1, '#050a12');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Particles effect
    ctx.save();
    for(let i = 0; i < 60; i++) {
       const x = (Math.sin(i * 24.5 + time * 0.3) * 0.5 + 0.5) * width;
       const y = ((i * 133 + time * -40) % height + height) % height;
       const radius = (Math.sin(i * 7 + time * 1.5) * 0.5 + 0.5) * 4 + 1;
       ctx.beginPath();
       ctx.arc(x, y, radius, 0, Math.PI*2);
       ctx.fillStyle = `rgba(59, 130, 246, ${Math.abs(Math.sin(i + time)) * 0.4})`;
       ctx.fill();
    }
    ctx.restore();

    if (!isExporting) return;

    if (tierLists.length === 0) return;

    const cols = tierLists.length;
    const colWidth = width / cols;
    const font = videoSettings.font || 'Inter';

    tierLists.forEach((activeTL, idx) => {
      const offsetX = idx * colWidth;

      // Draw Title
      const titleFontSize = Math.floor(height * 0.04);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${titleFontSize}px "${font}"`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(activeTL.name, offsetX + colWidth / 2, height * 0.08);
      ctx.shadowBlur = 0;

      // Tier list config
      const padding = width * 0.02;
      const startX = offsetX + padding;
      const startY = height * 0.12;
      const listWidth = colWidth - padding * 2;
      
      const maxAvailableHeight = height - startY - (height * 0.05);
      const rowHeight = maxAvailableHeight / Math.max(1, activeTL.tiers.length);
      const gap = Math.min(rowHeight * 0.05, 10);
      const labelWidth = Math.min(listWidth * 0.15, rowHeight * 1.5);

      let currentY = startY;

      activeTL.tiers.forEach(tier => {
        // Draw label box
        ctx.fillStyle = tier.color;
        ctx.fillRect(startX, currentY, labelWidth, rowHeight);
        
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(Math.min(labelWidth, rowHeight) * 0.4)}px "${font}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tier.label, startX + labelWidth / 2, currentY + rowHeight / 2);
        ctx.textBaseline = 'alphabetic'; // reset

        // Draw items container background
        ctx.fillStyle = 'rgba(34,34,34,0.8)';
        ctx.fillRect(startX + labelWidth + gap, currentY, listWidth - labelWidth - gap, rowHeight);

        // Draw images - proportionally matching the 1.5x larger HTML (approx 23% width)
        const maxImgSize = Math.floor(width * 0.23); 
        const imgSize = Math.min(rowHeight - (rowHeight * 0.1), maxImgSize);
        let imgX = startX + labelWidth + gap + (rowHeight * 0.05);
        let imgY = currentY + (rowHeight * 0.05);

        tier.items.forEach(itemId => {
          const rapper = rappers.find(r => r.id === itemId);
          if (!rapper) return;
          
          // Wrap to next line if exceeds width
          if (imgX + imgSize > startX + listWidth - gap) {
            imgX = startX + labelWidth + gap + (rowHeight * 0.05);
            imgY += imgSize + gap;
          }

          const img = images[itemId];
          if (img) {
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
          } else {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(imgX, imgY, imgSize, imgSize);
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${imgSize/2}px "${font}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rapper.name?.[0] || '?', imgX + imgSize/2, imgY + imgSize/2);
            ctx.textBaseline = 'alphabetic'; // reset
          }
          
          // Draw Name label
          const nameBgHeight = Math.max(16, imgSize * 0.25);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(imgX, imgY + imgSize - nameBgHeight, imgSize, nameBgHeight);
          ctx.fillStyle = '#fff';
          const fontSize = Math.max(12, Math.floor(nameBgHeight * 0.7));
          ctx.font = `${fontSize}px "${font}"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // clip name if too long
          let display = rapper.name;
          if (ctx.measureText(display).width > imgSize - 4) {
             display = display.substring(0, 8) + '...';
          }
          ctx.fillText(display, imgX + imgSize/2, imgY + imgSize - (nameBgHeight/2));
          ctx.textBaseline = 'alphabetic'; // reset

          imgX += imgSize + gap;
        });

        // Border for the row
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, currentY, listWidth, rowHeight);

        currentY += rowHeight + gap;
      });

      // Draw separator line
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(offsetX, 20);
        ctx.lineTo(offsetX, height - 20);
        ctx.stroke();
      }
    });
  };

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    drawFrame: (time) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        drawFrame(ctx, time);
      }
    }
  }));

  useEffect(() => {
    if (!isExporting && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      drawFrame(ctx, previewTime);
    }
  }, [previewTime, isExporting, images, tierLists, videoSettings]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain', 
        background: '#000' 
      }} 
    />
  );
});

export default CanvasRenderer;
