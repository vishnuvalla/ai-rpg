import React from 'react';
import { Item } from '../types';
import { Backpack, Shield, Sword, FlaskConical, Key, Gem, Wand2 } from 'lucide-react';

interface Props {
  items: Item[];
}

const InventoryView: React.FC<Props> = ({ items }) => {
  const equipped = items.filter(i => i.isEquipped);
  const backpack = items.filter(i => !i.isEquipped);

  const getIcon = (type: string) => {
    switch (type) {
        case 'Weapon': return <Sword className="w-4 h-4" />;
        case 'Armor': return <Shield className="w-4 h-4" />;
        case 'Consumable': return <FlaskConical className="w-4 h-4" />;
        case 'Key Item': return <Key className="w-4 h-4" />;
        case 'Focus': return <Wand2 className="w-4 h-4" />;
        case 'Artifact': return <Gem className="w-4 h-4" />;
        default: return <Backpack className="w-4 h-4" />;
    }
  };

  const renderItem = (item: Item, isEquipped: boolean) => (
    <div key={item.id} className={`p-4 border ${isEquipped ? 'border-term-highlight bg-term-highlight/10' : 'border-term-gray bg-term-dark'} mb-2`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                <span className={`${isEquipped ? 'text-term-highlight' : 'text-term-main'}`}>
                    {getIcon(item.type)}
                </span>
                <span className={`font-bold uppercase ${isEquipped ? 'text-term-highlight' : 'text-term-text'}`}>
                    {item.name} {item.quantity > 1 && `x${item.quantity}`}
                </span>
            </div>
            <span className="text-xs font-mono uppercase text-term-gray border border-term-gray px-1">
                {item.type}
            </span>
        </div>
        <p className="text-sm text-term-text/80 mt-2 font-mono">
            {item.description}
        </p>
        {item.effect && (
            <div className="mt-2 text-xs text-term-cyan uppercase">
                >> EFFECT: {item.effect}
            </div>
        )}
    </div>
  );

  return (
    <div className="flex flex-col h-full p-4 md:p-8 overflow-y-auto pb-32">
        <h2 className="text-3xl text-term-main mb-6 uppercase border-b border-term-gray pb-2 tracking-widest text-shadow flex items-center gap-3">
            <Backpack className="w-8 h-8" /> > INVENTORY_MANIFEST
        </h2>

        {/* Equipped Section */}
        {equipped.length > 0 && (
            <div className="mb-8">
                <h3 className="text-term-highlight uppercase tracking-widest text-sm mb-4 border-l-2 border-term-highlight pl-2">
                    // CURRENTLY_EQUIPPED
                </h3>
                {equipped.map(i => renderItem(i, true))}
            </div>
        )}

        {/* Backpack Section */}
        <div>
             <h3 className="text-term-gray uppercase tracking-widest text-sm mb-4 border-l-2 border-term-gray pl-2">
                // CARGO_HOLD
            </h3>
            {backpack.length === 0 && equipped.length === 0 ? (
                <div className="text-term-gray italic uppercase text-center py-8">>> INVENTORY EMPTY</div>
            ) : backpack.length === 0 ? (
                <div className="text-term-gray italic uppercase text-center py-8">>> BACKPACK EMPTY</div>
            ) : (
                backpack.map(i => renderItem(i, false))
            )}
        </div>
    </div>
  );
};

export default InventoryView;