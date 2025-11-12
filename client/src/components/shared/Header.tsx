import React from 'react';
import { XStack, YStack, H1, Text } from 'tamagui';

interface HeaderProps {
  status: string;
}

const Header: React.FC<HeaderProps> = ({ status }) => {
  return (
    <XStack 
      alignItems="center" 
      justifyContent="space-between" 
      paddingBottom="$4" 
      borderBottomWidth={1} 
      borderBottomColor="$borderColor"
      flexWrap="wrap"
      gap="$2"
      $xs={{ flexDirection: 'column', alignItems: 'center' }}
    >
      <YStack flex={1} $gtXs={{ minWidth: 0 }} />
      <H1 
        fontSize="$9" 
        $sm={{ fontSize: "$8" }}
        $xs={{ fontSize: "$7" }}
        fontWeight="700" 
        color="$color" 
        textAlign="center"
      >
        DaanaRX
      </H1>
      <YStack flex={1} alignItems="flex-end" $xs={{ alignItems: 'center', flex: 0 }}>
        <Text fontSize="$3" color="$gray">
          Status: <Text fontWeight="500">{status}</Text>
        </Text>
      </YStack>
    </XStack>
  );
};

export default Header;

