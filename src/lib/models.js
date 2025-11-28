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
        enum: ['restaurant', 'shop', 'logistics', 'education'],
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
    claim_email: { type: String }, // Email address used for claim verification
    claim_domain: { type: String }, // Domain used for DNS verification
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
    owner_reply: {
        text: String,
        createdAt: { type: Date, default: Date.now }
    },
    is_deleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
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

const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['claim_approved', 'claim_rejected', 'claim_pending', 'other'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Link to business or relevant page
    is_read: { type: Boolean, default: false },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed }, // Additional data like business_id, business_name
}, { timestamps: true });

// Indexes
BusinessSchema.index({ category: 1 });
BusinessSchema.index({ owner_id: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ aggregate_rating: -1 }); // For sorting by rating
ReviewSchema.index({ business_id: 1 });
ReviewSchema.index({ user_id: 1 });
ReportSchema.index({ review_id: 1 });
NotificationSchema.index({ user_id: 1 });

// Prevent overwrite on hot reload
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export { User, Business, Review, Report, Notification };
