import React, { useState, useMemo } from 'react';
import { TamaguiProvider, View, YStack, Spinner, Text } from 'tamagui';
import tamaguiConfig from './tamagui.config';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { ViewType, StatusStats } from './types';
import Header from './components/shared/Header';
import StatusBar from './components/shared/StatusBar';
import Home from './components/views/Home';
import CheckIn from './components/views/CheckIn';
import CheckOut from './components/views/CheckOut';
import Scan from './components/views/Scan';
import Inventory from './components/views/Inventory';
import Reports from './components/views/Reports';
import Admin from './components/views/AdminEnhanced';
import LabelDisplay from './components/views/LabelDisplay';
import { Unit } from './types';

const AppContent: React.FC = () => {
  const { loading, units, transactions, locations } = useFirebase();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [checkOutDaanaId, setCheckOutDaanaId] = useState<string>('');
  const [labelDisplayUnit, setLabelDisplayUnit] = useState<Unit | null>(null);

  const appStatus = loading ? 'Connecting...' : 'Online';

  const stats: StatusStats = useMemo(() => {
    const inStock = units.filter(u => u.status === 'in_stock' || u.status === 'partial').length;
    
    const now = new Date();
    const ninetyDaysFromNow = new Date(new Date().setDate(now.getDate() + 90));
    const expiringSoon = units.filter(u => {
      if (!u.exp_date) return false;
      const expDate = new Date(u.exp_date);
      return (u.status === 'in_stock' || u.status === 'partial') && expDate <= ninetyDaysFromNow;
    }).length;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checkedOutToday = transactions.filter(t => {
      return t.type === 'check_out' && t.timestamp && t.timestamp.toDate() >= twentyFourHoursAgo;
    }).length;
    
    return {
      inStock,
      expiringSoon,
      checkedOutToday
    };
  }, [units, transactions]);

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleCheckOutFromScan = (daanaId: string) => {
    setCheckOutDaanaId(daanaId);
  };

  const handleShowLabel = (unit: Unit) => {
    setLabelDisplayUnit(unit);
    setCurrentView('label-display');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'check-in':
        return <CheckIn onNavigate={handleNavigate} onShowLabel={handleShowLabel} />;
      case 'check-out':
        return <CheckOut onNavigate={handleNavigate} prefilledDaanaId={checkOutDaanaId} />;
      case 'scan':
        return <Scan onNavigate={handleNavigate} onCheckOutUnit={handleCheckOutFromScan} />;
      case 'inventory':
        return <Inventory onNavigate={handleNavigate} onCheckOutUnit={handleCheckOutFromScan} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} />;
      case 'admin':
        return <Admin onNavigate={handleNavigate} />;
      case 'label-display':
        const locationName = labelDisplayUnit 
          ? locations.find(l => l.id === labelDisplayUnit.location_id)?.name || 'Unknown'
          : 'Unknown';
        return <LabelDisplay onNavigate={handleNavigate} unit={labelDisplayUnit} locationName={locationName} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  if (loading) {
    return (
      <YStack flex={1} minHeight="100vh" alignItems="center" justifyContent="center" backgroundColor="$background">
        <YStack alignItems="center" space="$4">
          <Spinner size="large" color="$blue" />
          <Text color="$gray" fontSize="$5">Loading DaanaRX...</Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$4" $gtSm={{ padding: "$8" }} backgroundColor="$background">
      <YStack maxWidth={1280} width="100%" marginHorizontal="auto" backgroundColor="$background" padding="$6" borderRadius="$6" shadowColor="rgba(0,0,0,0.1)" shadowRadius={10} shadowOffset={{width: 0, height: 4}}>
        <Header status={appStatus} />
        <StatusBar stats={stats} />
        <View flex={1} id="app-content">{renderView()}</View>
      </YStack>
    </YStack>
  );
};

const App: React.FC = () => {
  return (
    <TamaguiProvider config={tamaguiConfig as any}>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </TamaguiProvider>
  );
};

export default App;

