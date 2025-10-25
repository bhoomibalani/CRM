# Location-Based Attendance System

## Overview

The attendance system now includes location validation to ensure that attendance can only be marked when the user is within 100 meters of the office location.

## Office Location

- **Latitude:** 26.1065
- **Longitude:** 91.5860
- **Maximum Distance:** 100 meters

## API Endpoints

### 1. Start Attendance
**POST** `/api/attendance/start`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "latitude": 26.1065,
    "longitude": 91.5860
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Attendance started successfully",
    "attendance": {
        "id": 1,
        "start_time": "2025-10-25 09:00:00",
        "status": "active"
    },
    "location": {
        "latitude": 26.1065,
        "longitude": 91.5860,
        "distance_from_office": 0.0
    }
}
```

**Error Response (400) - Location Too Far:**
```json
{
    "success": false,
    "message": "Location is too far from office. Distance: 150.5m (max allowed: 100m).",
    "distance": 150.5,
    "office_coordinates": {
        "latitude": 26.1065,
        "longitude": 91.5860
    },
    "max_distance": 100
}
```

**Error Response (400) - Invalid Coordinates:**
```json
{
    "success": false,
    "message": "Location data is required and must be valid coordinates",
    "errors": {
        "latitude": ["The latitude field is required."],
        "longitude": ["The longitude field is required."]
    }
}
```

### 2. End Attendance
**POST** `/api/attendance/end`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "latitude": 26.1065,
    "longitude": 91.5860
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Attendance ended successfully",
    "attendance": {
        "id": 1,
        "start_time": "2025-10-25 09:00:00",
        "end_time": "2025-10-25 17:00:00",
        "total_hours": "8:00",
        "status": "completed"
    },
    "location": {
        "latitude": 26.1065,
        "longitude": 91.5860,
        "distance_from_office": 0.0
    }
}
```

### 3. Get Office Location
**GET** `/api/attendance/office-location`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
    "success": true,
    "office_location": {
        "latitude": 26.1065,
        "longitude": 91.5860
    },
    "max_distance": 100
}
```

## Frontend Integration

### JavaScript Example

```javascript
// Get user's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Start attendance with location validation
async function startAttendance() {
    try {
        const location = await getCurrentLocation();
        
        const response = await fetch('/api/attendance/start', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Attendance started successfully');
            console.log('Distance from office:', data.location.distance_from_office + 'm');
        } else {
            console.error('Failed to start attendance:', data.message);
            if (data.distance) {
                console.log('You are', data.distance + 'm away from office');
                console.log('Maximum allowed distance:', data.max_distance + 'm');
            }
        }
    } catch (error) {
        console.error('Error getting location or starting attendance:', error);
    }
}

// End attendance with location validation
async function endAttendance() {
    try {
        const location = await getCurrentLocation();
        
        const response = await fetch('/api/attendance/end', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Attendance ended successfully');
        } else {
            console.error('Failed to end attendance:', data.message);
        }
    } catch (error) {
        console.error('Error getting location or ending attendance:', error);
    }
}
```

### React Example

```jsx
import React, { useState } from 'react';

const AttendanceComponent = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                reject,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    const startAttendance = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const location = await getCurrentLocation();
            
            const response = await fetch('/api/attendance/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(location)
            });

            const data = await response.json();
            
            if (data.success) {
                alert(`Attendance started! You are ${data.location.distance_from_office}m from office.`);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to get location or start attendance');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button onClick={startAttendance} disabled={isLoading}>
                {isLoading ? 'Starting...' : 'Start Attendance'}
            </button>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </div>
    );
};
```

## Testing

You can test the location validation using the provided test script:

```bash
cd php-backend-laravel
php test_location.php
```

## Error Handling

The system handles various error scenarios:

1. **Invalid Coordinates:** Latitude must be between -90 and 90, longitude between -180 and 180
2. **Location Too Far:** User must be within 100 meters of the office
3. **Missing Location Data:** Both latitude and longitude are required
4. **Geolocation Errors:** Frontend should handle cases where location access is denied

## Security Considerations

- Location validation is performed on the server side to prevent tampering
- All location data is logged for audit purposes
- The system uses the Haversine formula for accurate distance calculations
- Location data is not stored in the database, only logged temporarily

## Configuration

To modify the office location or maximum distance, update the constants in `app/Services/LocationService.php`:

```php
private const OFFICE_LATITUDE = 26.1065;  // Change this
private const OFFICE_LONGITUDE = 91.5860; // Change this
private const MAX_DISTANCE_METERS = 100;  // Change this
```
