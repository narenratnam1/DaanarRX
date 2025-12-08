'use client';

import { useState } from 'react';
import { useLazyQuery, gql } from '@apollo/client';
import { QrCodeIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { QRScanner } from '../../components/QRScanner';
import { GetUnitResponse, GetTransactionsResponse, SearchUnitsResponse, UnitData, TransactionData } from '../../types/graphql';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const GET_UNIT = gql`
  query GetUnit($unitId: ID!) {
    getUnit(unitId: $unitId) {
      unitId
      totalQuantity
      availableQuantity
      expiryDate
      optionalNotes
      drug {
        medicationName
        genericName
        strength
        strengthUnit
        form
      }
      lot {
        source
      }
    }
  }
`;

const GET_TRANSACTIONS = gql`
  query GetTransactions($unitId: ID!) {
    getTransactions(unitId: $unitId, page: 1, pageSize: 10) {
      transactions {
        transactionId
        timestamp
        type
        quantity
        notes
      }
    }
  }
`;

const SEARCH_UNITS = gql`
  query SearchUnits($query: String!) {
    searchUnitsByQuery(query: $query) {
      unitId
      availableQuantity
      expiryDate
      drug {
        medicationName
        genericName
      }
    }
  }
`;

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [unitId, setUnitId] = useState('');
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [getUnit] = useLazyQuery<GetUnitResponse>(GET_UNIT, {
    onCompleted: (data) => {
      if (data.getUnit) {
        setUnit(data.getUnit);
        getTransactions({ variables: { unitId: data.getUnit.unitId } });
        toast({
          title: 'Unit Found',
          description: `${data.getUnit.drug.medicationName}`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Unit not found',
        variant: 'destructive',
      });
    },
  });

  const [getTransactions] = useLazyQuery<GetTransactionsResponse>(GET_TRANSACTIONS, {
    onCompleted: (data) => {
      setTransactions(data.getTransactions.transactions);
    },
  });

  const [searchUnits, { data: searchData }] = useLazyQuery<SearchUnitsResponse>(SEARCH_UNITS);

  const handleSearch = () => {
    if (unitId.length >= 3) {
      if (unitId.length === 36) {
        // Full UUID
        getUnit({ variables: { unitId } });
      } else {
        // Partial search
        searchUnits({ variables: { query: unitId } });
      }
    }
  };

  const handleSelectUnit = (selectedUnit: UnitData) => {
    setUnitId(selectedUnit.unitId);
    getUnit({ variables: { unitId: selectedUnit.unitId } });
  };

  const handleClear = () => {
    setUnitId('');
    setUnit(null);
    setTransactions([]);
  };

  const handleQRScanned = (code: string) => {
    setShowQRScanner(false);
    setUnitId(code);
    getUnit({ variables: { unitId: code } });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Scan / Lookup" description="Quick access to unit information" showBackButton={false} />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowQRScanner(true)}
              className="w-full"
            >
              <QrCodeIcon className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>

            <div className="space-y-2">
              <Label htmlFor="unit-id">Unit ID</Label>
              <div className="flex gap-2">
                <Input
                  id="unit-id"
                  placeholder="Enter unit ID or search"
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value);
                    if (e.target.value.length >= 3) {
                      handleSearch();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1"
                />
                {unitId && (
                  <Button size="icon" variant="ghost" onClick={handleClear}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {searchData?.searchUnitsByQuery && searchData.searchUnitsByQuery.length > 0 && !unit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchData.searchUnitsByQuery.map((searchUnit: UnitData) => (
                        <TableRow key={searchUnit.unitId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{searchUnit.drug.medicationName}</p>
                              <p className="text-xs text-muted-foreground">{searchUnit.drug.genericName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={searchUnit.availableQuantity > 0 ? 'default' : 'destructive'}>
                              {searchUnit.availableQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(searchUnit.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleSelectUnit(searchUnit)}>
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {unit && (
          <>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold">{unit.drug.medicationName}</h3>
                  <Badge variant={unit.availableQuantity > 0 ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                    {unit.availableQuantity} / {unit.totalQuantity}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Generic Name</p>
                    <p className="font-bold">{unit.drug.genericName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strength</p>
                    <Badge variant="outline">
                      {unit.drug.strength} {unit.drug.strengthUnit}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Form</p>
                    <p className="font-bold">{unit.drug.form}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-bold">{unit.lot?.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <Badge 
                      variant={new Date(unit.expiryDate) < new Date() ? 'destructive' : 'secondary'}
                    >
                      {new Date(unit.expiryDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>

                {unit.optionalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{unit.optionalNotes}</p>
                  </div>
                )}

                <Button
                  onClick={() => router.push(`/checkout?unitId=${unit.unitId}`)}
                  disabled={unit.availableQuantity === 0}
                  className="w-full"
                >
                  Quick Check-Out
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: TransactionData) => (
                        <TableRow key={tx.transactionId}>
                          <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={tx.type === 'check_in' ? 'default' : 'secondary'}>
                              {tx.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{tx.quantity}</TableCell>
                          <TableCell className="text-sm">{tx.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <QRScanner
          opened={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScanned}
          title="Scan DaanaRX QR Code"
          description="Scan the QR code on the medication unit to look it up"
        />
      </div>
    </AppShell>
  );
}
