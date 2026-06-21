import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import CanvasRenderer from './CanvasRenderer';
import { TierListBoard } from './TierListEditor';
import { Play, Square, Download, RefreshCw, Cpu } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function ExportManager() {
  const { tierLists, videoSettings, activeAudio, audioBlobUrl } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [time, setTime] = useState(0);
  
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const audioRef = useRef(new Audio());
  const htmlBoardRef = useRef(null);
  const containerRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  const durationPerTopic = 2;
  const defaultDuration = (tierLists.length * videoSettings.durationPerList) || 10;
  const totalDuration = activeAudio ? ((activeAudio.end || (activeAudio.duration || 10)) - (activeAudio.start || 0)) : defaultDuration;

  const isPortrait = videoSettings.aspectRatio === '9:16';
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const rw = entry.contentRect.width;
        setScaleFactor(rw / width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    if (activeAudio && audioBlobUrl) {
      audioRef.current.src = audioBlobUrl;
    } else {
      audioRef.current.src = '';
    }
  }, [activeAudio, audioBlobUrl]);

  const loop = () => {
    if (!isPlaying) return;
    
    setTime((prev) => {
      const nextTime = prev + 1/60; // Assuming 60fps
      
      if (activeAudio && audioRef.current && audioRef.current.currentTime >= (activeAudio.end || activeAudio.duration)) {
        audioRef.current.pause();
      }

      if (nextTime >= totalDuration) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
        return 0;
      }
      return nextTime;
    });
    
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (time === 0 || time >= totalDuration) {
        setTime(0);
        if (activeAudio && audioRef.current) {
          audioRef.current.currentTime = activeAudio.start || 0;
          audioRef.current.play();
        }
      } else {
        if (activeAudio && audioRef.current) {
           const targetAudioTime = (activeAudio.start || 0) + time;
           if (targetAudioTime < (activeAudio.end || activeAudio.duration)) {
             audioRef.current.currentTime = targetAudioTime;
             audioRef.current.play();
           }
        }
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    }
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsPlaying(false);
    audioRef.current.pause();

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Đang khởi động...');

    // Small delay to let React render the "Đang khởi động..." UI before the heavy work starts
    await new Promise(r => setTimeout(r, 100));

    const canvas = rendererRef.current.getCanvas();
    const ctx = canvas.getContext('2d');
    
    // Create MediaStream from canvas
    const canvasStream = canvas.captureStream(30); // 30 FPS
    
    // Create Audio Stream if exists
    let combinedStream = canvasStream;
    let audioCtx, sourceNode, destNode;
    
    const activeSound = activeAudio;
    if (activeSound && audioBlobUrl) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioEl = new Audio(audioBlobUrl);
      audioEl.crossOrigin = "anonymous";
      
      await new Promise(resolve => {
        audioEl.oncanplaythrough = resolve;
      });

      sourceNode = audioCtx.createMediaElementSource(audioEl);
      destNode = audioCtx.createMediaStreamDestination();
      sourceNode.connect(destNode);
      sourceNode.connect(audioCtx.destination); // For listening while exporting if we want
      
      const audioStream = destNode.stream;
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          audioTrack
        ]);
      }
      
      audioEl.currentTime = activeSound.start || 0;
      
      audioEl.addEventListener('timeupdate', () => {
        if (audioEl.currentTime >= (activeSound.end || activeSound.duration)) {
          audioEl.pause();
        }
      });
      
      audioEl.play();
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      setExportStatus('Đang khởi động bộ nén video (FFmpeg)...');
      const webmBlob = new Blob(chunks, { type: mimeType });
      
      setIsConverting(true);
      setExportProgress(0);

      try {
        const ffmpeg = new FFmpeg();
        
        let lastLog = '';
        ffmpeg.on('log', ({ message }) => {
          console.log(message);
          lastLog = message;
        });

        ffmpeg.on('progress', ({ progress }) => {
          setExportProgress(Math.floor(progress * 100));
        });
        
        const baseURL = window.location.origin;
        await ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg/ffmpeg-core.wasm`
        });

        setExportStatus('Đang nén thành MP4 chuẩn...');
        const inputName = 'input.webm';
        const outputName = 'output.mp4';

        await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
        
        // Encode to H264 for mobile/tiktok compatibility
        const hasAudio = combinedStream.getAudioTracks().length > 0;
        const execArgs = ['-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28'];
        if (hasAudio) {
          execArgs.push('-c:a', 'aac');
        }
        execArgs.push(outputName);
        
        await ffmpeg.exec(execArgs);

        const data = await ffmpeg.readFile(outputName);
        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        
        const url = URL.createObjectURL(mp4Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rap_ranker_export.mp4';
        a.click();
        
        useStore.getState().addHistory('Xuất Video', `Đã xuất video MP4 độ dài ${totalDuration}s`);
      } catch (err) {
        console.error(err);
        // Fallback to webm
        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rap_ranker_export_fallback.webm';
        a.click();
        alert(`Lỗi FFmpeg: ${err.message || err.toString() || 'Unknown'}\nLog cuối: ${lastLog}\nĐã tự động tải xuống định dạng WebM thay thế.`);
      } finally {
        setIsExporting(false);
        setIsConverting(false);
        setExportProgress(0);
        if (audioCtx) audioCtx.close();
      }
    };

    recorder.start();

    // Render loop for export
    const frames = totalDuration * 30; // 30fps
    let currentFrame = 0;

    const renderNextFrame = () => {
      if (currentFrame === 0) {
        setExportStatus('Đang vẽ và ghi hình...');
      }

      if (currentFrame >= frames) {
        recorder.stop();
        return;
      }
      
      const t = currentFrame / 30;
      rendererRef.current.drawFrame(t);
      setExportProgress(Math.floor((currentFrame / frames) * 100));
      
      currentFrame++;
      // Give UI time to update and browser time to record
      setTimeout(renderNextFrame, 1000/30);
    };

    renderNextFrame();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '15px' }}>
      
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={togglePlay} className="btn btn-primary">
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
          {isPlaying ? 'Dừng xem trước' : 'Xem trước (Preview)'}
        </button>
        <button onClick={handleExport} className="btn btn-success" disabled={isExporting}>
          <Download size={16} /> Xuất Video (MP4)
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tỷ lệ (Khung hình):</label>
          <select 
            value={videoSettings.aspectRatio || '9:16'} 
            onChange={(e) => useStore.getState().setVideoSetting('aspectRatio', e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555' }}
          >
            <option value="16:9">Ngang 16:9 (YouTube/PC)</option>
            <option value="9:16">Dọc 9:16 (TikTok/Reels)</option>
          </select>
        </div>
      </div>
      
      <div className="canvas-container" style={{ position: 'relative', width: '100%', flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        
        <div ref={containerRef} style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: isPortrait ? 'calc(100vh * 9 / 16)' : '100%',
          maxHeight: isPortrait ? '100%' : 'calc(100vw * 9 / 16)',
          aspectRatio: isPortrait ? '9/16' : '16/9',
          border: '2px dashed rgba(255,255,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
              <CanvasRenderer ref={rendererRef} width={width} height={height} previewTime={time} isExporting={isExporting} />
            </div>

            {!isExporting && (
              <div ref={htmlBoardRef} style={{ width: '100%', height: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                <TierListBoard logicalWidth={width} logicalHeight={height} />
              </div>
            )}
          </div>
        </div>
        
        {isExporting && (
          <div className="export-overlay" style={{ zIndex: 10 }}>
            {isConverting ? (
              <>
                <Cpu size={48} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{exportStatus} {exportProgress > 0 ? `${exportProgress}%` : ''}</div>
              </>
            ) : (
              <>
                <RefreshCw size={48} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{exportStatus} {exportProgress > 0 ? `${exportProgress}%` : ''}</div>
              </>
            )}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${exportProgress}%`, background: isConverting ? '#10b981' : 'var(--primary)' }}></div>
            </div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={togglePlay} className="btn" style={{ flex: 1 }} disabled={isExporting}>
            {isPlaying ? <><Square size={16} /> Dừng</> : <><Play size={16} /> Xem trước (Preview)</>}
          </button>
          
          <button onClick={handleExport} className="btn btn-primary" style={{ flex: 1 }} disabled={isExporting}>
            <Download size={16} /> Xuất Video (MP4)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '40px' }}>{time.toFixed(1)}s</span>
          <input 
            type="range" 
            min="0" 
            max={totalDuration} 
            step="0.1" 
            value={time} 
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              setTime(newTime);
              if (isPlaying) {
                setIsPlaying(false);
              }
              if (activeAudio && audioRef.current) {
                audioRef.current.pause();
                const targetAudioTime = (activeAudio.start || 0) + newTime;
                if (targetAudioTime < (activeAudio.end || activeAudio.duration)) {
                  audioRef.current.currentTime = targetAudioTime;
                }
              }
            }} 
            disabled={isExporting}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '40px', textAlign: 'right' }}>{totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
