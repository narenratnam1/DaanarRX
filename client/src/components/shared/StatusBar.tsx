import React from 'react';
import { XStack, YStack, Text, Card } from 'tamagui';
import { StatusStats } from '../../types';

interface StatusBarProps {
  stats: StatusStats;
}

const StatusBar: React.FC<StatusBarProps> = ({ stats }) => {
  return (
    <Card
      elevate
      padding="$4"
      marginVertical="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <XStack 
        flexWrap="wrap" 
        gap="$6" 
        $xs={{ gap: "$4", flexDirection: "column" }}
        $sm={{ gap: "$5" }}
      >
        <YStack>
          <Text fontSize="$3" color="$gray">In Stock:</Text>
          <Text fontSize="$7" fontWeight="700" color="$green" marginLeft="$2">
            {stats.inStock}
          </Text>
        </YStack>
        <YStack>
          <Text fontSize="$3" color="$gray">Expiring Soon (90d):</Text>
          <Text fontSize="$7" fontWeight="700" color="$yellow" marginLeft="$2">
            {stats.expiringSoon}
          </Text>
        </YStack>
        <YStack>
          <Text fontSize="$3" color="$gray">Checked Out (24h):</Text>
          <Text fontSize="$7" fontWeight="700" color="$blue" marginLeft="$2">
            {stats.checkedOutToday}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
};

export default StatusBar;

