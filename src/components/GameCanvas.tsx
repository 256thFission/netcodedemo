'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Vector2D {
  x: number;
  y: number;
}

interface GamePiece {
  id: string;
  position: Vector2D;
  color: string;
  zIndex: number;
}

const GameCanvas = () => {
  const [pieces, setPieces] = useState<GamePiece[]>([
    { id: '1', position: { x: 100, y: 100 }, color: '#FF4444', zIndex: 1 },
    { id: '2', position: { x: 200, y: 150 }, color: '#44FF44', zIndex: 2 },
    { id: '3', position: { x: 300, y: 200 }, color: '#4444FF', zIndex: 3 },
  ]);
  const [selectedPiece, setSelectedPiece] = useState<GamePiece | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Vector2D>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Draw all pieces
  const drawPieces = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Sort pieces by zIndex before drawing
    const sortedPieces = [...pieces].sort((a, b) => a.zIndex - b.zIndex);

    sortedPieces.forEach(piece => {
      ctx.beginPath();
      ctx.arc(piece.position.x, piece.position.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = piece.color;
      ctx.fill();
      if (piece.id === selectedPiece?.id) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked piece (checking in reverse order to select top piece first)
    const clickedPiece = [...pieces]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(piece => {
        const dx = piece.position.x - x;
        const dy = piece.position.y - y;
        return (dx * dx + dy * dy) <= 400; // 20px radius squared
      });

    if (clickedPiece) {
      setSelectedPiece(clickedPiece);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedPiece.position.x,
        y: y - clickedPiece.position.y
      });
    } else {
      setSelectedPiece(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPiece || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setPieces(pieces.map(piece =>
      piece.id === selectedPiece.id
        ? { ...piece, position: { x, y } }
        : piece
    ));
  };

  const handleMouseUp = () => {
    if (isDragging && selectedPiece) {
      // Here you would typically emit the final position via WebSocket
      console.log('Piece moved:', {
        pieceId: selectedPiece.id,
        position: pieces.find(p => p.id === selectedPiece.id)?.position
      });
    }
    setIsDragging(false);
  };

  // Set up canvas and draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas if needed
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    drawPieces(ctx);
  }, [pieces, selectedPiece]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Game Canvas</h2>
        <p className="text-sm text-gray-600">Drag pieces to test movement</p>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="bg-white border-2 border-gray-300 rounded-lg shadow-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-4 text-sm">
        <p>Selected Piece: {selectedPiece ? `#${selectedPiece.id}` : 'None'}</p>
      </div>
    </div>
  );
};

export default GameCanvas;