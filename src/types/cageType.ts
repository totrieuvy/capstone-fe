export interface CageType {
    id: number;
    typeName: 'Standard' | 'Premium' | 'Family' | 'VIP';
    description: string;
    pricePerDay: number;
    size: string;
    status: 'available' | 'occupied' | 'maintenance';
}