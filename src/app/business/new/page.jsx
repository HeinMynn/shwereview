'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import Link from 'next/link';

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
        image: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

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
        const file = e.target.files[0];
        setErrors(prev => ({ ...prev, image: '' }));

        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: 'File size must be less than 2MB' }));
                e.target.value = '';
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, image: 'Only JPG, PNG, and GIF files are allowed' }));
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
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
        <main className="min-h-screen bg-slate-50 p-8">
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
                                <Input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., 123 Main St"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Image</label>
                                {errors.image && (
                                    <p className="text-sm text-red-600 mb-1">{errors.image}</p>
                                )}
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif"
                                    onChange={handleImageChange}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Accepted formats: JPG, PNG, GIF (Max 2MB)
                                    <br />
                                    Recommended size: 1200x800px (Landscape)
                                </p>
                                {formData.image && (
                                    <div className="mt-2 relative h-40 w-full rounded-md overflow-hidden border border-slate-200">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
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
        </main>
    );
}
