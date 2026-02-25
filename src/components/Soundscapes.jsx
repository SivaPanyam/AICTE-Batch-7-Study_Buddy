
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, CloudRain, Music, Wind } from 'lucide-react';
import clsx from 'clsx';

// Simple public domain or creative commons sound URLs
const SOUNDS = [
    { id: 'rain', label: 'Rain', icon: CloudRain, url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3' },
    { id: 'lofi', label: 'Lo-Fi', icon: Music, url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'white', label: 'Noise', icon: Wind, url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3' }
];

const Soundscapes = () => {
    const [activeSound, setActiveSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        audioRef.current.loop = true;
        return () => {
            audioRef.current.pause();
            audioRef.current.src = "";
        };
    }, []);

    useEffect(() => {
        if (activeSound) {
            if (audioRef.current.src !== activeSound.url) {
                audioRef.current.src = activeSound.url;
            }
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play error", e));
            } else {
                audioRef.current.pause();
            }
        } else {
            audioRef.current.pause();
        }
    }, [activeSound, isPlaying]);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const toggleSound = (sound) => {
        if (activeSound?.id === sound.id) {
            setIsPlaying(!isPlaying);
        } else {
            setActiveSound(sound);
            setIsPlaying(true);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <div className="bg-card/90 backdrop-blur border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 w-48 transition-all hover:border-primary-start/50 group">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>Atmosphere</span>
                    {isPlaying && <span className="text-green-400 animate-pulse">● Live</span>}
                </div>

                <div className="flex justify-between gap-2">
                    {SOUNDS.map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => toggleSound(sound)}
                            className={clsx(
                                "flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1",
                                activeSound?.id === sound.id && isPlaying
                                    ? "bg-primary-start text-white shadow-lg"
                                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                            )}
                            title={sound.label}
                        >
                            <sound.icon className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">{sound.label}</span>
                        </button>
                    ))}
                </div>

                {activeSound && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Volume2 className="w-4 h-4 text-primary-start" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-primary-start h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Soundscapes;
