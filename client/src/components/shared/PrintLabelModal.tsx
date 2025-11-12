import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Unit } from '../../types';

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
}

const PrintLabelModal: React.FC<PrintLabelModalProps> = ({ isOpen, onClose, unit }) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && unit && qrCodeRef.current) {
      qrCodeRef.current.innerHTML = '';
      
      QRCode.toCanvas(unit.qr_code_value, {
        width: 100,
        margin: 1,
        errorCorrectionLevel: 'L'
      }, (error, canvas) => {
        if (error) {
          console.error('Error generating QR code:', error);
          if (qrCodeRef.current) {
            qrCodeRef.current.innerHTML = '<p class="text-red-600 text-sm">Error generating QR code</p>';
          }
        } else if (qrCodeRef.current) {
          qrCodeRef.current.appendChild(canvas);
        }
      });
    }
  }, [isOpen, unit]);

  if (!isOpen || !unit) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Print Unit Label</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        
        <div id="print-label-content" className="py-4">
          <p className="text-center text-gray-600 mb-4">
            A new unit was created. Please print and apply this label.
          </p>
          
          <div className="w-full h-auto p-2 border-2 border-dashed border-gray-400 bg-white">
            <div className="flex flex-row gap-2">
              <div ref={qrCodeRef} className="w-[100px] h-[100px] flex-shrink-0" />
              
              <div className="flex flex-col justify-center flex-grow overflow-hidden">
                <strong className="block text-lg font-bold text-black truncate">
                  {unit.med_generic} {unit.strength} {unit.form}
                </strong>
                <span className="block text-sm text-black">
                  Exp {unit.exp_date} Qty {unit.qty_total}
                </span>
                <span className="block text-xs text-gray-700 mt-1">
                  {unit.location_name} {unit.daana_id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t modal-footer">
          <button 
            onClick={onClose}
            className="bg-gray-500 text-white py-2 px-6 rounded-md shadow hover:bg-gray-600"
          >
            Done
          </button>
          <button 
            onClick={handlePrint}
            className="bg-blue-600 text-white py-2 px-6 rounded-md shadow hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintLabelModal;

