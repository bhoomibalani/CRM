<?php

namespace App\Services;

class LocationService
{
    /**
     * Office coordinates (latitude, longitude)
     */
    private const OFFICE_LATITUDE = 26.1065;
    private const OFFICE_LONGITUDE = 91.5860;
    
    /**
     * Maximum allowed distance from office in meters
     */
    private const MAX_DISTANCE_METERS = 100;

    /**
     * Calculate distance between two coordinates using Haversine formula
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lon1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lon2 Longitude of second point
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLon / 2) * sin($deltaLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Validate if the given coordinates are within the allowed range of the office
     * 
     * @param float $latitude User's latitude
     * @param float $longitude User's longitude
     * @return array ['valid' => bool, 'distance' => float, 'message' => string]
     */
    public function validateLocation(float $latitude, float $longitude): array
    {
        // Validate coordinate ranges
        if ($latitude < -90 || $latitude > 90) {
            return [
                'valid' => false,
                'distance' => 0,
                'message' => 'Invalid latitude. Must be between -90 and 90 degrees.'
            ];
        }

        if ($longitude < -180 || $longitude > 180) {
            return [
                'valid' => false,
                'distance' => 0,
                'message' => 'Invalid longitude. Must be between -180 and 180 degrees.'
            ];
        }

        $distance = $this->calculateDistance(
            self::OFFICE_LATITUDE,
            self::OFFICE_LONGITUDE,
            $latitude,
            $longitude
        );

        $isValid = $distance <= self::MAX_DISTANCE_METERS;

        return [
            'valid' => $isValid,
            'distance' => round($distance, 2),
            'message' => $isValid 
                ? "Location is within range. Distance: {$distance}m from office."
                : "Location is too far from office. Distance: {$distance}m (max allowed: " . self::MAX_DISTANCE_METERS . "m)."
        ];
    }

    /**
     * Get office coordinates
     * 
     * @return array ['latitude' => float, 'longitude' => float]
     */
    public function getOfficeCoordinates(): array
    {
        return [
            'latitude' => self::OFFICE_LATITUDE,
            'longitude' => self::OFFICE_LONGITUDE
        ];
    }

    /**
     * Get maximum allowed distance from office
     * 
     * @return int Distance in meters
     */
    public function getMaxDistance(): int
    {
        return self::MAX_DISTANCE_METERS;
    }
}
