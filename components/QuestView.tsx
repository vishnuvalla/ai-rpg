import React from 'react';
import { Quest } from '../types';
import { ScrollText, CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

interface Props {
  quests: Quest[];
}

const QuestView: React.FC<Props> = ({ quests }) => {
  const activeQuests = quests.filter(q => q.status === 'Active');
  const completedQuests = quests.filter(q => q.status === 'Completed');
  const failedQuests = quests.filter(q => q.status === 'Failed');

  const renderQuest = (quest: Quest) => (
    <div key={quest.id} className={`p-5 border mb-4 bg-term-dark relative group ${
        quest.status === 'Active' ? 'border-term-main' : 
        quest.status === 'Completed' ? 'border-term-highlight opacity-75 hover:opacity-100' : 
        'border-term-red opacity-60 hover:opacity-100'
    }`}>
        {/* Status Icon */}
        <div className="absolute top-4 right-4">
            {quest.status === 'Active' && <CircleDashed className="w-5 h-5 text-term-main animate-pulse" />}
            {quest.status === 'Completed' && <CheckCircle2 className="w-5 h-5 text-term-highlight" />}
            {quest.status === 'Failed' && <XCircle className="w-5 h-5 text-term-red" />}
        </div>

        <h3 className={`text-xl font-bold uppercase tracking-wide mb-2 pr-8 ${
             quest.status === 'Active' ? 'text-term-text' : 
             quest.status === 'Completed' ? 'text-term-highlight line-through' : 
             'text-term-red line-through'
        }`}>
            {quest.title}
        </h3>
        
        <p className="text-sm text-term-gray font-mono mb-4 whitespace-pre-wrap">
            {quest.description}
        </p>

        {quest.objectives && quest.objectives.length > 0 && (
            <div className="bg-term-bg/50 p-3 border border-term-gray/20">
                <div className="text-xs uppercase text-term-gray mb-2">Objectives:</div>
                <ul className="space-y-1">
                    {quest.objectives.map((obj, idx) => (
                        <li key={idx} className="text-sm font-mono flex items-start gap-2">
                            <span className="text-term-main mt-1">>></span>
                            <span className={quest.status === 'Completed' ? 'text-term-gray' : 'text-term-text'}>{obj}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );

  return (
    <div className="flex flex-col h-full p-4 md:p-8 overflow-y-auto pb-32">
        <h2 className="text-3xl text-term-main mb-6 uppercase border-b border-term-gray pb-2 tracking-widest text-shadow flex items-center gap-3">
            <ScrollText className="w-8 h-8" /> > MISSION_LOG
        </h2>

        {/* Active */}
        <div className="mb-8">
            <h3 className="text-term-main uppercase tracking-widest text-sm mb-4 border-l-2 border-term-main pl-2">
                // ACTIVE_DIRECTIVES
            </h3>
            {activeQuests.length === 0 ? (
                <div className="text-term-gray italic uppercase py-4">>> NO ACTIVE MISSIONS</div>
            ) : (
                activeQuests.map(renderQuest)
            )}
        </div>

        {/* Completed */}
        {(completedQuests.length > 0 || failedQuests.length > 0) && (
             <div>
                <h3 className="text-term-gray uppercase tracking-widest text-sm mb-4 border-l-2 border-term-gray pl-2">
                    // ARCHIVED_LOGS
                </h3>
                {completedQuests.map(renderQuest)}
                {failedQuests.map(renderQuest)}
            </div>
        )}
    </div>
  );
};

export default QuestView;