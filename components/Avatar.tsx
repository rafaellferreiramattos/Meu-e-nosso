
import React from 'react';
import type { User } from '../types';

interface AvatarProps {
    user?: User;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className = 'w-12 h-12' }) => {
    if (!user) return <div className={`${className} rounded-full bg-gray-600`} />;

    if (user.avatarUrl) {
        return (
            <img 
                src={user.avatarUrl} 
                alt={user.name}
                className={`${className} rounded-full object-cover border-2 border-slate-700`}
            />
        );
    }

    return (
        <div 
            className={`${className} rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-slate-700 ${user.bgColor}`}
        >
            {user.initials}
        </div>
    );
};

export default Avatar;
