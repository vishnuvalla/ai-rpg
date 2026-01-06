import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
}

const StoryView: React.FC<Props> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const formatText = (text: string) => {
    const parts = text.split('--- NOVEL STATE ---');
    const narrative = parts[0];
    const footer = parts.length > 1 ? parts[1] : null;

    return (
      <>
        <div className="prose prose-terminal prose-lg max-w-none text-term-text">
          <ReactMarkdown>{narrative.trim()}</ReactMarkdown>
        </div>
        {footer && (
          <div className="mt-6 border-t border-dashed border-term-gray pt-4 text-sm font-mono text-term-gray">
            <h4 className="font-bold text-term-main mb-2 uppercase tracking-widest">[ SYSTEM_STATE ]</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 opacity-80">
                {footer.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                    <div key={idx} className="break-words">{line}</div>
                ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          
          {msg.isRoll && (
             <div className="mb-2 flex items-center gap-2 bg-term-gray/10 px-4 py-2 border border-term-gray text-xs animate-pulse">
                <span className="text-term-main">
                   >> RNG_OUTCOME: {msg.rollResult} / DC {msg.rollDC} -- {msg.rollOutcome}
                </span>
             </div>
          )}

          <div
            className={`max-w-4xl w-full p-6 border ${
              msg.role === 'user'
                ? 'bg-term-gray/10 border-term-main text-right'
                : 'bg-transparent border-none p-0'
            }`}
          >
            {msg.role === 'user' ? (
                <p className="font-mono text-lg uppercase text-term-main">"{msg.text}"</p>
            ) : (
                formatText(msg.text)
            )}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex items-start pl-6">
            <span className="inline-block w-3 h-6 bg-term-main animate-blink-cursor"></span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default StoryView;