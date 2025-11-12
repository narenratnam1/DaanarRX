import React from 'react';
import { YStack, XStack, H2, Card } from 'tamagui';
import { 
  PackagePlus, 
  PackageMinus, 
  ScanLine, 
  Boxes, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { ViewType } from '../../types';

interface HomeProps {
  onNavigate: (view: ViewType) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <YStack flex={1} space="$6" paddingVertical="$4">
      {/* Main three buttons */}
      <XStack 
        flexWrap="wrap" 
        gap="$6" 
        justifyContent="center"
        $xs={{ flexDirection: "column" }}
        $sm={{ flexDirection: "column" }}
        $gtMd={{ flexDirection: "row" }}
      >
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('check-in')}
          backgroundColor="$background"
          padding="$10"
          borderRadius="$4"
          flex={1}
          minWidth={200}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
          $sm={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$3">
            <PackagePlus size={48} color="#15803d" />
            <H2 fontSize="$8" fontWeight="600" color="#15803d">Check In</H2>
          </YStack>
        </Card>
        
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('check-out')}
          backgroundColor="$background"
          padding="$10"
          borderRadius="$4"
          flex={1}
          minWidth={200}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
          $sm={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$3">
            <PackageMinus size={48} color="#a16207" />
            <H2 fontSize="$8" fontWeight="600" color="#a16207">Check Out</H2>
          </YStack>
        </Card>
        
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('scan')}
          backgroundColor="$background"
          padding="$10"
          borderRadius="$4"
          flex={1}
          minWidth={200}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
          $sm={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$3">
            <ScanLine size={48} color="#1d4ed8" />
            <H2 fontSize="$8" fontWeight="600" color="#1d4ed8">Scan / Lookup</H2>
          </YStack>
        </Card>
      </XStack>
      
      {/* Secondary buttons */}
      <XStack 
        flexWrap="wrap" 
        gap="$4" 
        justifyContent="center"
        $xs={{ flexDirection: "column" }}
      >
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('inventory')}
          backgroundColor="$background"
          padding="$6"
          borderRadius="$4"
          flex={1}
          minWidth={150}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$2">
            <Boxes size={36} color="#4338ca" />
            <H2 fontSize="$6" fontWeight="600" color="#4338ca">Inventory</H2>
          </YStack>
        </Card>
        
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('reports')}
          backgroundColor="$background"
          padding="$6"
          borderRadius="$4"
          flex={1}
          minWidth={150}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$2">
            <BarChart3 size={36} color="#7e22ce" />
            <H2 fontSize="$6" fontWeight="600" color="#7e22ce">Reports</H2>
          </YStack>
        </Card>
        
        <Card
          elevate
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          animation="quick"
          hoverStyle={{ scale: 1.02, y: -4 }}
          onPress={() => onNavigate('admin')}
          backgroundColor="$background"
          padding="$6"
          borderRadius="$4"
          flex={1}
          minWidth={150}
          cursor="pointer"
          $xs={{ minWidth: "100%" }}
        >
          <YStack alignItems="center" justifyContent="center" space="$2">
            <Settings size={36} color="#374151" />
            <H2 fontSize="$6" fontWeight="600" color="#374151">Admin</H2>
          </YStack>
        </Card>
      </XStack>
    </YStack>
  );
};

export default Home;

