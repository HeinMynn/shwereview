'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function NewBusinessPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Steps: 'role' -> 'form'
    const [step, setStep] = useState('role');
    const [role, setRole] = useState(null); // 'owner' | 'customer'

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        category: 'restaurant',
        images: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [country, setCountry] = useState('Myanmar'); // Default country
    const [geoStatus, setGeoStatus] = useState(null);

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep('form');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'name') {
            handleSearch(value);
        }
    };

    // Debounced search
    const handleSearch = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/businesses/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.businesses || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setErrors(prev => ({ ...prev, images: '' }));

        if (files.length + formData.images.length > 5) {
            setErrors(prev => ({ ...prev, images: 'You can upload a maximum of 5 images' }));
            return;
        }

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, images: 'Each file must be less than 5MB' }));
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, images: 'Only JPG, PNG, GIF and WEBP files are allowed' }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session) return;

        setIsSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create business');

            const data = await res.json();
            const businessId = data.business._id;

            setSuccess('Business submitted successfully!');

            setTimeout(() => {
                if (role === 'owner') {
                    router.push(`/business/${businessId}/claim`);
                } else {
                    router.push(`/business/${businessId}`);
                }
            }, 1500);
        } catch (error) {
            console.error(error);
            setErrors(prev => ({ ...prev, submit: 'Error submitting business. Please try again.' }));
            setIsSubmitting(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <Card className="p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-2">Add a Business</h2>
                    <p className="text-gray-600 mb-4">Please login to submit a new business.</p>
                    <Link href="/login">
                        <Button>Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Add a New Business</h1>

                {step === 'role' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                            className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-indigo-600 group"
                            onClick={() => handleRoleSelect('owner')}
                        >
                            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                                <span className="text-2xl">💼</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">I own this business</h3>
                            <p className="text-gray-600">
                                List your business, claim ownership, and manage your presence.
                            </p>
                        </Card>

                        <Card
                            className="p-8 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-600 group"
                            onClick={() => handleRoleSelect('customer')}
                        >
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                                <span className="text-2xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">I'm a customer</h3>
                            <p className="text-gray-600">
                                Add a place you visited to share your experience and review.
                            </p>
                        </Card>
                    </div>
                )}

                {step === 'form' && (
                    <Card className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <button
                                onClick={() => setStep('role')}
                                className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                            >
                                ← Back to role selection
                            </button>
                            <span className="text-sm font-medium px-3 py-1 bg-slate-100 rounded-full capitalize">
                                Role: {role}
                            </span>
                        </div>

                        {errors.submit && (
                            <div className="bg-red-50 text-red-700 p-3 rounded mb-6 text-sm border border-red-200">
                                {errors.submit}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-700 p-3 rounded mb-6 text-sm border border-green-200">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., The Gourmet Spot"
                                    autoComplete="off"
                                />
                                {/* Search Results Dropdown */}
                                {formData.name.length >= 2 && searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        <div className="p-2 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-800 font-medium">
                                            Similar businesses found:
                                        </div>
                                        {searchResults.map(business => (
                                            <div key={business._id} className="p-3 hover:bg-gray-50 border-b last:border-0 flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium text-gray-900">{business.name}</div>
                                                    <div className="text-xs text-gray-500">{business.address}</div>
                                                </div>
                                                {role === 'customer' ? (
                                                    <Link href={`/business/${business._id}`}>
                                                        <Button size="sm" variant="outline" type="button">
                                                            Write Review
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/business/${business._id}/claim`}>
                                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" type="button">
                                                            Claim This
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    className="w-full min-h-[100px] rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                    placeholder="Brief description of the business..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full md:w-32 rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                                    >
                                        <option value="Myanmar">Myanmar</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="Thailand">Thailand</option>
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="Vietnam">Vietnam</option>
                                    </select>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter Street, City"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full md:w-auto whitespace-nowrap"
                                        onClick={async () => {
                                            if (!formData.address) return;
                                            setGeoStatus({ message: 'Fetching...', type: 'info' });
                                            try {
                                                const query = `${formData.address}, ${country}`;
                                                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                                const data = await res.json();
                                                if (data && data.length > 0) {
                                                    const { lat, lon, display_name } = data[0];
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        address: display_name, // Auto-fill full address
                                                        geo_coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
                                                    }));
                                                    setGeoStatus({ message: 'Address found!', type: 'success' });
                                                    setTimeout(() => setGeoStatus(null), 3000);
                                                } else {
                                                    setGeoStatus({ message: 'Address not found', type: 'error' });
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                setGeoStatus({ message: 'Failed to fetch', type: 'error' });
                                            }
                                        }}
                                    >
                                        Get Address
                                    </Button>
                                </div>
                                {geoStatus && (
                                    <p className={`text-xs mt-1 ${geoStatus.type === 'success' ? 'text-green-600' :
                                        geoStatus.type === 'error' ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                        {geoStatus.message}
                                    </p>
                                )}

                                {formData.geo_coordinates && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Coordinates set: {formData.geo_coordinates.lat.toFixed(4)}, {formData.geo_coordinates.lng.toFixed(4)}
                                    </p>
                                )}
                                <div className="mt-4">
                                    <LocationPicker
                                        position={formData.geo_coordinates}
                                        onLocationSelect={(pos) => setFormData(prev => ({ ...prev, geo_coordinates: pos }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Images</label>
                                {errors.images && (
                                    <p className="text-sm text-red-600 mb-1">{errors.images}</p>
                                )}
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif,.webp"
                                    onChange={handleImageChange}
                                    className="cursor-pointer"
                                    multiple
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Accepted formats: JPG, PNG, GIF, WEBP (Max 5MB). Max 5 images.
                                </p>

                                {formData.images.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {formData.images.map((img, index) => (
                                            <div key={index} className="relative h-24 rounded-md overflow-hidden border border-slate-200 group">
                                                <img
                                                    src={img}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                                >
                                    <option value="restaurant">Restaurant</option>
                                    <option value="shop">Shop</option>
                                    <option value="logistics">Logistics</option>
                                    <option value="education">Education</option>
                                </select>
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Submitting...' : (role === 'owner' ? 'Submit & Claim Business' : 'Submit Business')}
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </main >
    );
}
