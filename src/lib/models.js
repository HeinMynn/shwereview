import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String }, // In a real app, this would be hashed
    avatar: { type: String },
    badges: [{ type: String }],
    role: {
        type: String,
        enum: ['Super Admin', 'Owner', 'User'],
        default: 'User',
    },
    account_status: {
        type: String,
        enum: ['active', 'warning', 'suspended', 'banned'],
        default: 'active',
    },
    warning_count: { type: Number, default: 0 },
}, { timestamps: true });

const BusinessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    geo_coordinates: {
        lat: Number,
        lng: Number,
    },
    category: {
        type: String,
        enum: ['restaurant', 'retail', 'logistics'],
        required: true,
    },
    images: [{ type: String }],
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who submitted the listing
    is_verified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected'],
        default: 'pending',
    },
    claim_status: {
        type: String,
        enum: ['unclaimed', 'pending', 'approved', 'rejected'],
        default: 'unclaimed',
    },
    claimant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claim_proof: { type: String }, // URL or text proof
    claim_verification_method: {
        type: String,
        enum: ['document', 'dns', 'email'],
        default: 'document'
    },
    claim_verification_data: { type: String }, // DNS TXT record or Email address
    claim_verification_status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    aggregate_rating: { type: Number, default: 0 },
    micro_metrics_aggregates: { type: Map, of: Number, default: {} },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    text_content: { type: String, required: true },
    media: [{ type: String }],
    overall_rating: { type: Number, required: true },
    verified_purchase: { type: Boolean, default: false },
    is_anonymous: { type: Boolean, default: false },
    category_snapshot: { type: String, required: true },
    micro_ratings: { type: Map, of: Number, required: true },
    is_edited: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
    reason: {
        type: String,
        enum: ['spam', 'harassment', 'inappropriate', 'fake', 'other'],
        required: true,
    },
    custom_reason: { type: String },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending',
    },
}, { timestamps: true });

// Prevent overwrite on hot reload
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export { User, Business, Review, Report };
