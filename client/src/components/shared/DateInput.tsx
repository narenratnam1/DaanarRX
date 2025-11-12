import React from 'react';
import './DateInput.css';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  size?: 1 | 2 | 3 | 4 | 5;
  min?: string;
  max?: string;
}

const DateInput: React.FC<DateInputProps> = ({ 
  value, 
  onChange, 
  placeholder,
  required = false,
  size = 4,
  min,
  max
}) => {
  const sizeMap: Record<number, string> = {
    1: 'date-input-sm',
    2: 'date-input-sm',
    3: 'date-input-md',
    4: 'date-input-lg',
    5: 'date-input-xl',
  };

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      className={`date-input ${sizeMap[size]}`}
    />
  );
};

export default DateInput;

