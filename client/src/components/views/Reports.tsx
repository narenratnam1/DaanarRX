import React, { useState, useMemo } from 'react';
import { YStack, XStack, Button, Text, H2, Card, Label, ScrollView } from 'tamagui';
import { ViewType } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import Modal from '../shared/Modal';
import DateInput from '../shared/DateInput';

interface ReportsProps {
  onNavigate: (view: ViewType) => void;
}

const Reports: React.FC<ReportsProps> = ({ onNavigate }) => {
  const { transactions } = useFirebase();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(txn => {
        if (!txn.timestamp) return false;
        const txnDate = txn.timestamp.toDate();
        return txnDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the whole day
      filtered = filtered.filter(txn => {
        if (!txn.timestamp) return false;
        const txnDate = txn.timestamp.toDate();
        return txnDate < end;
      });
    }
    
    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
    });
  }, [transactions, startDate, endDate]);

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      showInfoModal('Info', 'No data to export.');
      return;
    }
    
    const headers = ['Timestamp', 'Type', 'Daana ID', 'Qty', 'Patient Ref', 'Notes'];
    let csvContent = headers.join(',') + '\n';
    
    filteredTransactions.forEach(txn => {
      const row = [
        `"${txn.timestamp?.toDate().toLocaleString() || 'N/A'}"`,
        txn.type,
        txn.daana_id,
        txn.qty || '',
        `"${txn.patient_ref || ''}"`,
        `"${txn.reason_note || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daanarx_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <YStack flex={1} space="$4" paddingVertical="$4">
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2" $xs={{ flexDirection: "column" }}>
        <Button 
          onPress={() => onNavigate('home')}
          backgroundColor="$gray"
          color="white"
          size="$4"
          hoverStyle={{ backgroundColor: "#4b5563" }}
          pressStyle={{ backgroundColor: "#374151" }}
          icon={<Text>←</Text>}
          $xs={{ width: "100%", order: 1 }}
        >
          Back to Home
        </Button>
        <H2 fontSize="$9" fontWeight="600" color="$color" $xs={{ fontSize: "$8", order: 2, width: "100%" }}>
          Transaction Log
        </H2>
        <Button 
          onPress={exportToCSV}
          backgroundColor="$gray"
          color="white"
          size="$4"
          hoverStyle={{ backgroundColor: "#4b5563" }}
          pressStyle={{ backgroundColor: "#374151" }}
          $xs={{ width: "100%", order: 3 }}
        >
          Export CSV
        </Button>
      </XStack>
      
      {/* Date Filters */}
      <Card elevate backgroundColor="$background" padding="$4" borderRadius="$4">
        <XStack flexWrap="wrap" gap="$4" alignItems="flex-end" $xs={{ flexDirection: "column", alignItems: "stretch" }}>
          <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }}>
            <Label fontSize="$3" fontWeight="500" color="$color">Start Date</Label>
            <DateInput 
              size={4}
              value={startDate}
              onChange={setStartDate}
            />
          </YStack>
          <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }}>
            <Label fontSize="$3" fontWeight="500" color="$color">End Date</Label>
            <DateInput 
              size={4}
              value={endDate}
              onChange={setEndDate}
            />
          </YStack>
          <Button 
            size="$4"
            backgroundColor="$gray"
            color="white"
            onPress={() => {
              setStartDate('');
              setEndDate('');
            }}
            hoverStyle={{ backgroundColor: "#4b5563" }}
            pressStyle={{ backgroundColor: "#374151" }}
            $xs={{ width: "100%" }}
          >
            Clear Filters
          </Button>
        </XStack>
      </Card>
      
      <Card elevate backgroundColor="$background" borderRadius="$4" overflow="hidden">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <YStack width="100%" minWidth={1000}>
            {/* Table Header */}
            <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor" alignItems="center">
              <Text flex={2} minWidth={180} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 150 }}>Timestamp</Text>
              <Text flex={1} minWidth={100} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 80 }}>Type</Text>
              <Text flex={2} minWidth={150} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 120 }}>Daana ID</Text>
              <Text flex={0.5} minWidth={60} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 50 }}>Qty</Text>
              <Text flex={1.5} minWidth={120} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 100 }}>Patient</Text>
              <Text flex={3} minWidth={200} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="left" $xs={{ minWidth: 180 }}>Notes</Text>
            </XStack>
            
            {/* Table Body */}
            {filteredTransactions.length === 0 ? (
              <YStack padding="$6" alignItems="center">
                <Text color="$gray" textAlign="center">
                  No transactions found for this period.
                </Text>
              </YStack>
            ) : (
              filteredTransactions.map(txn => (
                <XStack 
                  key={txn.id}
                  padding="$3"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                  hoverStyle={{ backgroundColor: "$backgroundHover" }}
                  alignItems="center"
                >
                  <Text flex={2} minWidth={180} fontSize="$3" color="$gray" paddingRight="$3" textAlign="left" $xs={{ minWidth: 150, fontSize: "$2" }}>
                    {txn.timestamp?.toDate().toLocaleString() || 'N/A'}
                  </Text>
                  <Text flex={1} minWidth={100} fontSize="$3" fontWeight="500" color="$color" textTransform="capitalize" paddingRight="$3" textAlign="left" $xs={{ minWidth: 80, fontSize: "$2" }}>
                    {txn.type.replace('_', ' ')}
                  </Text>
                  <Text flex={2} minWidth={150} fontSize="$2" color="$gray" fontFamily="$mono" paddingRight="$3" textAlign="left" $xs={{ minWidth: 120, fontSize: "$1" }}>
                    {txn.daana_id}
                  </Text>
                  <Text flex={0.5} minWidth={60} fontSize="$3" color="$gray" paddingRight="$3" textAlign="left" $xs={{ minWidth: 50 }}>
                    {txn.qty || 'N/A'}
                  </Text>
                  <Text flex={1.5} minWidth={120} fontSize="$3" color="$gray" paddingRight="$3" textAlign="left" $xs={{ minWidth: 100, fontSize: "$2" }}>
                    {txn.patient_ref || ''}
                  </Text>
                  <Text flex={3} minWidth={200} fontSize="$3" color="$gray" textAlign="left" $xs={{ minWidth: 180, fontSize: "$2" }}>
                    {txn.reason_note || ''}
                  </Text>
                </XStack>
              ))
            )}
          </YStack>
        </ScrollView>
      </Card>
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
      >
        <YStack space="$4">
          <Text paddingVertical="$4">{modalMessage}</Text>
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button 
              onPress={() => setShowModal(false)}
              backgroundColor="$blue"
              color="white"
              size="$4"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
            >
              OK
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
};

export default Reports;

