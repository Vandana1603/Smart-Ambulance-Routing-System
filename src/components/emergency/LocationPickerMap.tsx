import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search } from 'lucide-react';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  label: string;
  currentAddress?: string;
}

export default function LocationPickerMap({
  onLocationSelect,
  initialLocation,
  label,
  currentAddress,
}: LocationPickerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (map.current) {
          map.current.setView([latitude, longitude], 15);
          
          if (marker.current) {
            marker.current.remove();
          }
          
          marker.current = L.marker([latitude, longitude], { draggable: true })
            .addTo(map.current);
          
          marker.current.on('dragend', async () => {
            if (!marker.current) return;
            const pos = marker.current.getLatLng();
            const address = await reverseGeocode(pos.lat, pos.lng);
            onLocationSelect({
              address,
              latitude: pos.lat,
              longitude: pos.lng,
            });
          });
        }
        
        onLocationSelect({
          address: display_name,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          if (map.current) {
            map.current.setView([latitude, longitude], 15);
            
            if (marker.current) {
              marker.current.remove();
            }
            
            marker.current = L.marker([latitude, longitude], { draggable: true })
              .addTo(map.current);
            
            marker.current.on('dragend', async () => {
              if (!marker.current) return;
              const pos = marker.current.getLatLng();
              const address = await reverseGeocode(pos.lat, pos.lng);
              onLocationSelect({
                address,
                latitude: pos.lat,
                longitude: pos.lng,
              });
            });
          }

          const address = await reverseGeocode(latitude, longitude);
          onLocationSelect({
            address,
            latitude,
            longitude,
          });
          
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialLat = initialLocation?.latitude || 0;
    const initialLng = initialLocation?.longitude || 0;
    const initialZoom = initialLocation ? 13 : 2;

    map.current = L.map(mapContainer.current).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    if (initialLocation) {
      marker.current = L.marker([initialLat, initialLng], { draggable: true })
        .addTo(map.current);

      marker.current.on('dragend', async () => {
        if (!marker.current) return;
        const pos = marker.current.getLatLng();
        const address = await reverseGeocode(pos.lat, pos.lng);
        onLocationSelect({
          address,
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });
    }

    map.current.on('click', async (e) => {
      const { lat, lng } = e.latlng;

      if (marker.current) {
        marker.current.remove();
      }

      marker.current = L.marker([lat, lng], { draggable: true })
        .addTo(map.current!);

      marker.current.on('dragend', async () => {
        if (!marker.current) return;
        const pos = marker.current.getLatLng();
        const address = await reverseGeocode(pos.lat, pos.lng);
        onLocationSelect({
          address,
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });

      const address = await reverseGeocode(lat, lng);
      onLocationSelect({
        address,
        latitude: lat,
        longitude: lng,
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={loading}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type location or click on map"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              geocodeAddress(searchQuery);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => geocodeAddress(searchQuery)}
          disabled={loading || !searchQuery}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {currentAddress && (
        <div className="p-3 bg-muted rounded-md text-sm">
          <p className="text-muted-foreground">Selected: {currentAddress}</p>
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-[400px] rounded-lg border border-border shadow-sm"
      />
      
      <p className="text-sm text-muted-foreground">
        Click anywhere on the map to set location, type an address to search, or drag the marker to adjust
      </p>
    </div>
  );
}
