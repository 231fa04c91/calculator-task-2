
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

interface CalculatorHistoryProps {
  history: CalculationHistory[];
  onClearHistory: () => void;
  onSelectCalculation: (calc: CalculationHistory) => void;
}

const CalculatorHistory: React.FC<CalculatorHistoryProps> = ({
  history,
  onClearHistory,
  onSelectCalculation
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/20 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Calculation History
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Clear all history"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-64">
        {history.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No calculations yet
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((calc) => (
              <button
                key={calc.id}
                onClick={() => onSelectCalculation(calc)}
                className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 group"
                aria-label={`Select calculation: ${calc.expression} equals ${calc.result}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {calc.expression}
                    </div>
                    <div className="text-lg font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                      = {calc.result}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 ml-2 flex-shrink-0">
                    {formatTime(calc.timestamp)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {history.length > 0 && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
          Click any calculation to use its result
        </div>
      )}
    </Card>
  );
};

export default CalculatorHistory;
