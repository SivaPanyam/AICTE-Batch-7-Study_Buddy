import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, title, icon: Icon, action }) => {
    return (
        <div className={clsx("bg-card border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col", className)}>
            {(title || Icon || action) && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 bg-gray-800 rounded-lg">
                                <Icon className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

export default Card;
