import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
    const [pieces, setPieces] = useState<any[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 150 }).map((_, index) => {
            const colors = ['#06b6d4', '#2dd4bf', '#facc15', '#fb923c', '#f472b6'];
            return {
                id: index,
                style: {
                    left: `${Math.random() * 100}vw`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    animationDuration: `${Math.random() * 3 + 4}s`,
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    width: `${Math.random() * 6 + 8}px`,
                    height: `${Math.random() * 6 + 8}px`,
                },
            };
        });
        setPieces(newPieces);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] overflow-hidden">
            {pieces.map(piece => (
                <div key={piece.id} className="confetti" style={piece.style} />
            ))}
        </div>
    );
};

export default Confetti;