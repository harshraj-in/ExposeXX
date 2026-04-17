import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Soft Ambient Blobs */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 80, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ex-cyan/10 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, -60, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ex-navy/10 dark:bg-ex-cyan/5 blur-[100px] rounded-full"
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
            
            {/* Animated particles */}
            <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ 
                            opacity: 0, 
                            x: Math.random() * window.innerWidth, 
                            y: Math.random() * window.innerHeight 
                        }}
                        animate={{ 
                            opacity: [0, 0.5, 0],
                            y: [null, '-=100']
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-ex-cyan rounded-full shadow-[0_0_10px_#22d3ee]"
                    />
                ))}
            </div>
        </div>
    );
};

export default AnimatedBackground;
