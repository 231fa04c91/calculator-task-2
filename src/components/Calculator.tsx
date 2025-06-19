
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import CalculatorHistory from './CalculatorHistory';
import { Calculator as CalculatorIcon, History } from 'lucide-react';

interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calculator-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calculator-history', JSON.stringify(history));
  }, [history]);

  const clearError = useCallback(() => {
    if (hasError) {
      setHasError(false);
    }
  }, [hasError]);

  const inputNumber = useCallback((num: string) => {
    clearError();
    
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand, clearError]);

  const inputDecimal = useCallback(() => {
    clearError();
    
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand, clearError]);

  const clear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHasError(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
    setHasError(false);
  }, []);

  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(`${inputValue} ${nextOperation}`);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      try {
        switch (operation) {
          case '+':
            result = currentValue + inputValue;
            break;
          case '-':
            result = currentValue - inputValue;
            break;
          case '*':
            result = currentValue * inputValue;
            break;
          case '/':
            if (inputValue === 0) {
              throw new Error('Division by zero');
            }
            result = currentValue / inputValue;
            break;
          case '%':
            result = (currentValue * inputValue) / 100;
            break;
          default:
            return;
        }

        const fullExpression = `${expression} ${inputValue}`;
        const resultStr = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');

        // Add to history
        const newHistoryItem: CalculationHistory = {
          id: Date.now().toString(),
          expression: fullExpression,
          result: resultStr,
          timestamp: new Date()
        };

        setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]); // Keep last 50 calculations
        
        setDisplay(resultStr);
        setPreviousValue(result);
        setExpression(nextOperation ? `${resultStr} ${nextOperation}` : '');
      } catch (error) {
        setHasError(true);
        setDisplay('Error');
        setPreviousValue(null);
        setExpression('');
        toast({
          title: "Calculation Error",
          description: error instanceof Error ? error.message : "Invalid operation",
          variant: "destructive",
        });
        return;
      }
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, expression, toast]);

  const calculate = useCallback(() => {
    performOperation('');
    setOperation(null);
    setPreviousValue(null);
    setWaitingForOperand(true);
  }, [performOperation]);

  const percentage = useCallback(() => {
    const value = parseFloat(display) / 100;
    setDisplay(value.toString());
  }, [display]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      
      if (key >= '0' && key <= '9') {
        event.preventDefault();
        inputNumber(key);
      } else if (key === '.') {
        event.preventDefault();
        inputDecimal();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        event.preventDefault();
        performOperation(key);
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
      } else if (key === 'Escape') {
        event.preventDefault();
        clear();
      } else if (key === 'Backspace') {
        event.preventDefault();
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      } else if (key === 'Delete') {
        event.preventDefault();
        clearEntry();
      } else if (key === '%') {
        event.preventDefault();
        percentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputNumber, inputDecimal, performOperation, calculate, clear, clearEntry, percentage, display]);

  const buttonClass = (variant: 'number' | 'operator' | 'equals' | 'clear' = 'number') => {
    const base = "h-16 text-lg font-semibold transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-offset-2";
    
    switch (variant) {
      case 'operator':
        return `${base} bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-300`;
      case 'equals':
        return `${base} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300`;
      case 'clear':
        return `${base} bg-red-500 hover:bg-red-600 text-white focus:ring-red-300`;
      default:
        return `${base} bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 focus:ring-slate-300`;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalculatorIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Calculator</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="p-2"
              aria-label="Toggle calculation history"
            >
              <History className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Display */}
        <div className="mb-6">
          {expression && (
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 h-5 truncate">
              {expression}
            </div>
          )}
          <div 
            className={`text-right text-3xl font-mono font-bold p-4 rounded-lg transition-colors duration-200 ${
              hasError 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-300' 
                : 'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
            role="textbox"
            aria-label={`Calculator display showing ${display}`}
            aria-live="polite"
          >
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* First Row */}
          <Button
            onClick={clear}
            className={buttonClass('clear')}
            aria-label="All Clear"
          >
            AC
          </Button>
          <Button
            onClick={clearEntry}
            className={buttonClass('clear')}
            aria-label="Clear Entry"
          >
            CE
          </Button>
          <Button
            onClick={percentage}
            className={buttonClass('operator')}
            aria-label="Percentage"
          >
            %
          </Button>
          <Button
            onClick={() => performOperation('/')}
            className={buttonClass('operator')}
            aria-label="Divide"
          >
            ÷
          </Button>

          {/* Second Row */}
          <Button
            onClick={() => inputNumber('7')}
            className={buttonClass()}
            aria-label="Seven"
          >
            7
          </Button>
          <Button
            onClick={() => inputNumber('8')}
            className={buttonClass()}
            aria-label="Eight"
          >
            8
          </Button>
          <Button
            onClick={() => inputNumber('9')}
            className={buttonClass()}
            aria-label="Nine"
          >
            9
          </Button>
          <Button
            onClick={() => performOperation('*')}
            className={buttonClass('operator')}
            aria-label="Multiply"
          >
            ×
          </Button>

          {/* Third Row */}
          <Button
            onClick={() => inputNumber('4')}
            className={buttonClass()}
            aria-label="Four"
          >
            4
          </Button>
          <Button
            onClick={() => inputNumber('5')}
            className={buttonClass()}
            aria-label="Five"
          >
            5
          </Button>
          <Button
            onClick={() => inputNumber('6')}
            className={buttonClass()}
            aria-label="Six"
          >
            6
          </Button>
          <Button
            onClick={() => performOperation('-')}
            className={buttonClass('operator')}
            aria-label="Subtract"
          >
            −
          </Button>

          {/* Fourth Row */}
          <Button
            onClick={() => inputNumber('1')}
            className={buttonClass()}
            aria-label="One"
          >
            1
          </Button>
          <Button
            onClick={() => inputNumber('2')}
            className={buttonClass()}
            aria-label="Two"
          >
            2
          </Button>
          <Button
            onClick={() => inputNumber('3')}
            className={buttonClass()}
            aria-label="Three"
          >
            3
          </Button>
          <Button
            onClick={() => performOperation('+')}
            className={buttonClass('operator')}
            aria-label="Add"
          >
            +
          </Button>

          {/* Fifth Row */}
          <Button
            onClick={() => inputNumber('0')}
            className={`${buttonClass()} col-span-2`}
            aria-label="Zero"
          >
            0
          </Button>
          <Button
            onClick={inputDecimal}
            className={buttonClass()}
            aria-label="Decimal point"
          >
            .
          </Button>
          <Button
            onClick={calculate}
            className={buttonClass('equals')}
            aria-label="Equals"
          >
            =
          </Button>
        </div>

        {/* Keyboard Hint */}
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Tip: Use your keyboard for input • ESC to clear • Enter for equals
        </div>
      </Card>

      {/* History Panel */}
      {showHistory && (
        <CalculatorHistory 
          history={history} 
          onClearHistory={() => setHistory([])}
          onSelectCalculation={(calc) => {
            setDisplay(calc.result);
            setExpression('');
            setPreviousValue(null);
            setOperation(null);
            setWaitingForOperand(true);
          }}
        />
      )}
    </div>
  );
};

export default Calculator;
