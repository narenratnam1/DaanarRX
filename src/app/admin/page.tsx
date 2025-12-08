'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { GetLocationsResponse, LocationData } from '../../types/graphql';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const GET_LOCATIONS = gql`
  query GetLocations {
    getLocations {
      locationId
      name
      temp
      createdAt
    }
  }
`;

const CREATE_LOCATION = gql`
  mutation CreateLocation($input: CreateLocationInput!) {
    createLocation(input: $input) {
      locationId
      name
      temp
    }
  }
`;

const UPDATE_LOCATION = gql`
  mutation UpdateLocation($input: UpdateLocationInput!) {
    updateLocation(input: $input) {
      locationId
      name
      temp
    }
  }
`;

const DELETE_LOCATION = gql`
  mutation DeleteLocation($locationId: ID!) {
    deleteLocation(locationId: $locationId)
  }
`;

export default function AdminPage() {
  const { toast } = useToast();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [name, setName] = useState('');
  const [temp, setTemp] = useState<string>('room_temp');

  const { data, refetch } = useQuery<GetLocationsResponse>(GET_LOCATIONS);

  const [createLocation, { loading: creating }] = useMutation(CREATE_LOCATION, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Location created successfully',
      });
      setModalOpened(false);
      setName('');
      setTemp('room_temp');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [updateLocation, { loading: updating }] = useMutation(UPDATE_LOCATION, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
      setModalOpened(false);
      setEditingLocation(null);
      setName('');
      setTemp('room_temp');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [deleteLocation] = useMutation(DELETE_LOCATION, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (editingLocation) {
      updateLocation({
        variables: {
          input: {
            locationId: editingLocation.locationId,
            name,
            temp: temp as 'fridge' | 'room_temp',
          },
        },
      });
    } else {
      createLocation({
        variables: {
          input: {
            name,
            temp: temp as 'fridge' | 'room_temp',
          },
        },
      });
    }
  };

  const handleEdit = (location: LocationData) => {
    setEditingLocation(location);
    setName(location.name);
    setTemp(location.temp === 'room temp' ? 'room_temp' : 'fridge');
    setModalOpened(true);
  };

  const handleDelete = (locationId: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      deleteLocation({ variables: { locationId } });
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setName('');
    setTemp('room_temp');
    setModalOpened(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PageHeader title="Admin" description="Manage locations and clinic settings" showBackButton={true} />
          <Button onClick={openCreateModal}>Create Location</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.getLocations && data.getLocations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.getLocations.map((location: LocationData) => (
                    <TableRow key={location.locationId}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell className="capitalize">{location.temp.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm">{new Date(location.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(location)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(location.locationId)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No locations created yet</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={modalOpened} onOpenChange={setModalOpened}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Location' : 'Create Location'}</DialogTitle>
              <DialogDescription>
                {editingLocation ? 'Update the location details' : 'Add a new storage location for medications'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="location-name">Location Name *</Label>
                <Input
                  id="location-name"
                  placeholder="e.g., Main Refrigerator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature *</Label>
                <Select value={temp} onValueChange={setTemp}>
                  <SelectTrigger id="temperature">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fridge">Refrigerated (Fridge)</SelectItem>
                    <SelectItem value="room_temp">Room Temperature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={creating || updating}>
                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLocation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
