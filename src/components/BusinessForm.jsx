'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function BusinessForm({ initialData, onSubmit, isSubmitting, submitLabel, role, showRoleSelector = false, onRoleChange }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        category: '',
        images: [],
        geo_coordinates: null,
        ...initialData
    });

    const [errors, setErrors] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [country, setCountry] = useState('Myanmar');
    const [geoStatus, setGeoStatus] = useState(null);
    const [categories, setCategories] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.categories) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (formData.category && categories.length > 0) {
            const selectedCat = categories.find(c => c.slug === formData.category || c.name === formData.category);
            if (selectedCat) {
                setAvailableSubcategories(selectedCat.subcategories || []);
            } else {
                setAvailableSubcategories([]);
            }
        }
    }, [formData.category, categories]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'name' && !initialData) { // Only search on new creation
            handleSearch(value);
        }
    };

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

        e.target.value = '';
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate CTA URL if present
        if (formData.cta_url && !/^https?:\/\//i.test(formData.cta_url)) {
            setErrors(prev => ({ ...prev, cta_url: 'URL must start with http:// or https://' }));
            return;
        }

        onSubmit(formData);
    };

    return (
        <Card className="p-6">
            {showRoleSelector && (
                <div className="mb-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => onRoleChange(null)}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                    >
                        ← Back to role selection
                    </button>
                    <span className="text-sm font-medium px-3 py-1 bg-slate-100 rounded-full capitalize">
                        Role: {role}
                    </span>
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
                    {/* Search Results Dropdown (Only for new businesses) */}
                    {!initialData && formData.name.length >= 2 && searchResults.length > 0 && (
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
                                            address: display_name,
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Max 5)</label>
                    <div className="flex gap-2 mb-2">
                        <Input
                            placeholder="Add a tag (e.g., 'seafood', 'wifi', 'outdoor')"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.target.value.trim();
                                    if (val && (!formData.tags || formData.tags.length < 5) && !formData.tags?.includes(val)) {
                                        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                                        e.target.value = '';
                                    }
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                                const input = e.target.previousSibling;
                                const val = input.value.trim();
                                if (val && (!formData.tags || formData.tags.length < 5) && !formData.tags?.includes(val)) {
                                    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                                    input.value = '';
                                }
                            }}
                        >
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tags?.map((tag, index) => (
                            <span key={index} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Press Enter to add. Tags help users find your business in search.
                    </p>
                </div>



                {/* Pro Features: Custom CTA */}
                {initialData?.subscription_tier === 'pro' && (
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <span className="text-lg">✨</span> Pro Feature: Custom Call-to-Action
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-indigo-800 mb-1">Button Text</label>
                                <select
                                    name="cta_text"
                                    value={formData.cta_text || 'Book Now'}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                                >
                                    <option value="Book Now">Book Now</option>
                                    <option value="Visit Website">Visit Website</option>
                                    <option value="Learn More">Learn More</option>
                                    <option value="Contact Us">Contact Us</option>
                                    <option value="Sign Up">Sign Up</option>
                                    <option value="View Menu">View Menu</option>
                                    <option value="Shop Now">Shop Now</option>
                                    <option value="Order Online">Order Online</option>
                                    <option value="Get Quote">Get Quote</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-indigo-800 mb-1">Button Link</label>
                                <Input
                                    name="cta_url"
                                    value={formData.cta_url || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="bg-white"
                                />
                                {errors.cta_url && <p className="text-xs text-red-600 mt-1">{errors.cta_url}</p>}
                                <p className="text-xs text-indigo-600 mt-1">Must start with http:// or https://</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }));
                            }}
                            className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                        >
                            <option value="">Select a Category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                        <select
                            name="subcategory"
                            value={formData.subcategory || ''}
                            onChange={handleChange}
                            disabled={!availableSubcategories.length}
                            className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="">Select a Subcategory</option>
                            {availableSubcategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : submitLabel}
                </Button>
            </form>
        </Card >
    );
}
