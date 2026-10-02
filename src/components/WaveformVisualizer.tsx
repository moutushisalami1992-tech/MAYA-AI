import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  colorScheme?: 'speaking' | 'listening' | 'thinking' | 'idle';
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  analyser,
  isActive,
  colorScheme = 'idle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Idle gentle wave
        const time = Date.now() * 0.003;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(time + i * 0.2) * 10 + 15;
        }
      }

      const barCount = 36;
      const step = Math.floor(dataArray.length / barCount);
      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const normalized = val / 255;
        const barHeight = Math.max(4, normalized * (height * 0.85));

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        let fillGradient: CanvasGradient;
        if (colorScheme === 'speaking') {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, '#ec4899'); // pink-500
          fillGradient.addColorStop(0.5, '#a855f7'); // purple-500
          fillGradient.addColorStop(1, '#6366f1'); // indigo-500
        } else if (colorScheme === 'listening') {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, '#06b6d4'); // cyan-500
          fillGradient.addColorStop(0.5, '#8b5cf6'); // purple-500
          fillGradient.addColorStop(1, '#ec4899'); // pink-500
        } else if (colorScheme === 'thinking') {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, '#c084fc'); // purple-400
          fillGradient.addColorStop(0.5, '#f472b6'); // pink-400
          fillGradient.addColorStop(1, '#818cf8'); // indigo-400
        } else {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }

        ctx.fillStyle = fillGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive, colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={50}
      className="w-full max-w-[280px] h-[50px] mx-auto pointer-events-none opacity-90"
    />
  );
};
