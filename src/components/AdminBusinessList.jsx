'use client';

import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

import Toast from './Toast';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
});

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function AdminBusinessList({ initialBusinesses, initialClaims }) {
    // Use SWR for real-time updates
    const { data, error } = useSWR('/api/admin/businesses', fetcher, {
        fallbackData: { businesses: initialBusinesses, claims: initialClaims },
        refreshInterval: 15000, // Poll every 15 seconds
        revalidateOnFocus: true,
    });

    const businesses = data?.businesses || [];
    const claims = data?.claims || [];
    const [loadingId, setLoadingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [geoStatus, setGeoStatus] = useState(null);
    const [categories, setCategories] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', address: '', category: '', subcategory: '', images: [] });
    const [imageUploads, setImageUploads] = useState([]); // New images to upload (base64)

    // Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [businessToReject, setBusinessToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [customRejectionReason, setCustomRejectionReason] = useState('');

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
        if (editForm.category && categories.length > 0) {
            const selectedCat = categories.find(c => c.slug === editForm.category);
            if (selectedCat) {
                setAvailableSubcategories(selectedCat.subcategories || []);
            } else {
                setAvailableSubcategories([]);
            }
        } else {
            setAvailableSubcategories([]);
        }
    }, [editForm.category, categories]);

    const updateStatus = async (businessId, newStatus, reason = null) => {
        // ... (existing updateStatus logic)
        console.log('Updating status for:', businessId, 'to', newStatus);
        setLoadingId(businessId);
        try {
            const res = await fetch('/api/admin/business-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, status: newStatus, rejection_reason: reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(`Server Error (${res.status}): ${data.error || 'Unknown error'}`);
            }

            // Optimistic update or revalidate
            mutate('/api/admin/businesses');
            setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
        } catch (error) {
            console.error('Update failed:', error);
            setToast({ message: `Failed to update status: ${error.message}`, type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    const toggleVerification = async (businessId, currentStatus) => {
        // ... (existing toggleVerification logic)
        setLoadingId(businessId);
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, isVerified: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to update');

            mutate('/api/admin/businesses');
            setToast({ message: 'Verification status updated', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to update verification status', type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    const handleClaim = async (claimId, action) => {
        setLoadingId(claimId);
        try {
            const res = await fetch('/api/admin/claim-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claimId, action }),
            });

            if (!res.ok) throw new Error('Failed to update claim');

            mutate('/api/admin/businesses');
            setToast({ message: `Claim ${action}ed`, type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to process claim', type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    const openRejectModal = (business) => {
        setBusinessToReject(business);
        setRejectionReason('Duplicate Business');
        setCustomRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!businessToReject) return;

        const finalReason = rejectionReason === 'Other' ? customRejectionReason : rejectionReason;
        await updateStatus(businessToReject._id, 'rejected', finalReason);

        setRejectModalOpen(false);
        setBusinessToReject(null);
    };



    const handleEditClick = (business) => {
        setEditingBusiness(business);
        setEditForm({
            name: business.name,
            description: business.description || '',
            address: business.address || '',
            category: business.category || '',
            subcategory: business.subcategory || '',
            country: business.country || 'Myanmar',
            images: business.images || [],
            geo_coordinates: business.geo_coordinates || { lat: '', lng: '' }
        });
        setImageUploads([]);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) return; // Skip > 5MB
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUploads(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index, isExisting) => {
        if (isExisting) {
            setEditForm(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }));
        } else {
            setImageUploads(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoadingId(editingBusiness._id);
        try {
            // Combine existing images and new uploads
            const allImages = [...editForm.images, ...imageUploads];

            const res = await fetch('/api/admin/businesses/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: editingBusiness._id,
                    updates: { ...editForm, images: allImages }
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update');

            mutate('/api/admin/businesses');
            setToast({ message: 'Business updated successfully', type: 'success' });
            setEditingBusiness(null);
        } catch (error) {
            console.error(error);
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Reject Business</h3>
                        <p className="mb-4 text-gray-600">Please select a reason for rejecting <b>{businessToReject?.name}</b>.</p>

                        <div className="space-y-3 mb-4">
                            {['Duplicate Business', 'Does Not Exist', 'Inappropriate Content', 'Spam', 'Other'].map(reason => (
                                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="rejectionReason"
                                        value={reason}
                                        checked={rejectionReason === reason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span className="text-gray-900">{reason}</span>
                                </label>
                            ))}
                        </div>

                        {rejectionReason === 'Other' && (
                            <textarea
                                value={customRejectionReason}
                                onChange={(e) => setCustomRejectionReason(e.target.value)}
                                placeholder="Enter specific reason..."
                                className="w-full p-2 border border-gray-300 rounded mb-4"
                                rows={3}
                            />
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRejectConfirm}>Reject Business</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingBusiness && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Business</h3>
                            <button onClick={() => setEditingBusiness(null)} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value, subcategory: '' })}
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Subcategory</label>
                                    <select
                                        value={editForm.subcategory || ''}
                                        onChange={e => setEditForm({ ...editForm, subcategory: e.target.value })}
                                        disabled={!availableSubcategories.length}
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">Select a Subcategory</option>
                                        {availableSubcategories.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <select
                                        value={editForm.country || 'Myanmar'}
                                        onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                                        className="w-full md:w-32 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="Myanmar">Myanmar</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="Thailand">Thailand</option>
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="Vietnam">Vietnam</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        placeholder="Enter Street, City"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full md:w-auto whitespace-nowrap"
                                        onClick={async () => {
                                            if (!editForm.address) return;
                                            setGeoStatus({ message: 'Fetching...', type: 'info' });
                                            try {
                                                const query = `${editForm.address}, ${editForm.country || 'Myanmar'}`;
                                                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                                const data = await res.json();
                                                if (data && data.length > 0) {
                                                    const { lat, lon, display_name } = data[0];
                                                    setEditForm(prev => ({
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
                            </div>

                            {/* Location Picker */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
                                <LocationPicker
                                    position={editForm.geo_coordinates}
                                    onLocationSelect={(coords) => setEditForm({ ...editForm, geo_coordinates: coords })}
                                />
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={editForm.geo_coordinates?.lat || ''}
                                            onChange={e => setEditForm({
                                                ...editForm,
                                                geo_coordinates: { ...editForm.geo_coordinates, lat: parseFloat(e.target.value) }
                                            })}
                                            className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-900 text-sm"
                                            placeholder="Latitude"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={editForm.geo_coordinates?.lng || ''}
                                            onChange={e => setEditForm({
                                                ...editForm,
                                                geo_coordinates: { ...editForm.geo_coordinates, lng: parseFloat(e.target.value) }
                                            })}
                                            className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-900 text-sm"
                                            placeholder="Longitude"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={3}
                                />
                            </div>

                            {/* Image Management */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Images</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                                    {/* Existing Images */}
                                    {editForm.images.map((img, idx) => (
                                        <div key={`existing-${idx}`} className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
                                            <img src={img} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx, true)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* New Uploads */}
                                    {imageUploads.map((img, idx) => (
                                        <div key={`new-${idx}`} className="relative aspect-square bg-gray-100 rounded overflow-hidden group border-2 border-indigo-200">
                                            <img src={img} alt={`New ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx, false)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Upload Button */}
                                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                                        <span className="text-3xl text-gray-400">+</span>
                                        <span className="text-xs text-gray-500 mt-1">Add Image</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setEditingBusiness(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loadingId === editingBusiness._id}>
                                    {loadingId === editingBusiness._id ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Claims Section */}
            {claims.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-4">Pending Claims</h3>
                    <div className="space-y-3">
                        {claims.map(claim => (
                            <div key={claim._id} className="bg-white p-3 rounded border border-orange-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900">{claim.business_id?.name || 'Unknown Business'}</div>

                                        {/* Claimant Info */}
                                        <div className="text-sm text-gray-700 mt-1">
                                            <span className="font-semibold">Claimant:</span>{' '}
                                            {claim.claimant_id?.name || 'Unknown'}{' '}
                                            <span className="text-gray-600">({claim.claimant_id?.email || 'N/A'})</span>
                                        </div>

                                        <div className="mt-1 text-xs">
                                            <span className="font-bold text-gray-700">Method: </span>
                                            <span className="uppercase bg-gray-200 px-2 py-0.5 rounded text-gray-900 font-medium">{claim.verification_method || 'Document'}</span>
                                        </div>

                                        {claim.verification_method === 'document' && claim.proof && (
                                            <a href={claim.proof} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                                View Proof Document
                                            </a>
                                        )}

                                        {claim.verification_method === 'dns' && (
                                            <div className="text-xs mt-1 space-y-1">
                                                <div className="mb-1">
                                                    <span className="font-semibold text-gray-700">Domain:</span>{' '}
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded text-gray-900 font-medium">
                                                        {claim.domain || 'Not provided'}
                                                    </span>
                                                </div>
                                                <div className="text-gray-700">
                                                    <span className="font-semibold">Token:</span>{' '}
                                                    <code className="bg-gray-100 px-1 text-gray-900">{claim.verification_data?.substring(0, 20)}...</code>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Status:</span>{' '}
                                                    <span className={`font-bold ${claim.verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {claim.verification_status}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {claim.verification_method === 'email' && (
                                            <div className="text-xs text-gray-700 mt-1">
                                                <div className="mb-1">
                                                    <span className="font-semibold">Verification Email:</span>{' '}
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded text-gray-900 font-medium">{claim.email || claim.verification_data?.split('|')[0]}</span>
                                                </div>
                                                <span className={`font-bold ${claim.verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {claim.verification_status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                            onClick={() => handleClaim(claim._id, 'approve')}
                                            disabled={loadingId === claim._id}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white h-8"
                                            onClick={() => handleClaim(claim._id, 'reject')}
                                            disabled={loadingId === claim._id}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Business List */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">All Businesses</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {businesses.map(business => (
                        <div key={business._id} className="p-3 bg-white border rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900 flex items-center gap-2">
                                        {business.name}
                                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${business.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            business.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {business.status || 'pending'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        Owner: {business.owner_id ? (business.owner_id.name || 'Assigned') : 'Unclaimed'}
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase mt-1">{business.category}</div>

                                    {/* Appeal Message Display */}
                                    {business.status === 'pending' && business.appeal_message && (
                                        <div className="mt-2 bg-blue-50 border border-blue-200 p-2 rounded text-sm text-blue-800">
                                            <span className="font-bold block mb-1">📢 Appeal Message:</span>
                                            {business.appeal_message}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs"
                                        onClick={() => handleEditClick(business)}
                                    >
                                        Edit
                                    </Button>
                                    <button
                                        onClick={() => toggleVerification(business._id, business.is_verified)}
                                        disabled={loadingId === business._id}
                                        className={`flex items-center px-3 py-1.5 rounded text-sm font-bold transition-colors ${business.is_verified
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {loadingId === business._id ? (
                                            <span className="animate-pulse">...</span>
                                        ) : business.is_verified ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Allow actions for Pending and Rejected (to revert) */}
                            {(business.status !== 'approved') && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 justify-end">
                                    <button
                                        type="button"
                                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(business._id, 'approved');
                                        }}
                                        disabled={loadingId === business._id}
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>

                                    {/* Only show reject button if not already rejected */}
                                    {business.status !== 'rejected' && (
                                        <button
                                            type="button"
                                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openRejectModal(business);
                                            }}
                                            disabled={loadingId === business._id}
                                            title="Reject"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
