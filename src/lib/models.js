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
    email_verified: { type: Boolean, default: false },
    verification_token: { type: String },
    verification_token_expires: { type: Date },
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
    deletedAt: { type: Date },
    helpful_count: { type: Number, default: 0 },
    not_helpful_count: { type: Number, default: 0 }
}, { timestamps: true });

const ReviewVoteSchema = new mongoose.Schema({
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vote_type: {
        type: String,
        enum: ['helpful', 'not_helpful'],
        required: true
    }
}, { timestamps: true });

// Ensure one vote per user per review
ReviewVoteSchema.index({ review_id: 1, user_id: 1 }, { unique: true });

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
BusinessSchema.index({ submitted_by: 1 }); // For dashboard queries
BusinessSchema.index({ createdAt: -1 }); // For sorting by date
BusinessSchema.index({ name: 'text', description: 'text', address: 'text' }); // Text search index

// Compound Indexes for Performance
BusinessSchema.index({ status: 1, aggregate_rating: -1 }); // Home page "Top Rated" query
BusinessSchema.index({ category: 1, aggregate_rating: -1 }); // Search page filtering
BusinessSchema.index({ status: 1, category: 1 }); // Search page category filter

ReviewSchema.index({ business_id: 1 });
ReviewSchema.index({ user_id: 1 });
ReviewSchema.index({ createdAt: -1 }); // For sorting by date
ReviewSchema.index({ business_id: 1, createdAt: -1 }); // Business page reviews sort
ReportSchema.index({ review_id: 1 });
NotificationSchema.index({ user_id: 1 });

const HomepageConfigSchema = new mongoose.Schema({
    hero: {
        title: { type: String, default: 'Discover & Review Local Businesses' },
        subtitle: { type: String, default: 'Find trusted businesses in Myanmar.' },
        backgroundImage: { type: String, default: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000&auto=format&fit=crop' },
        searchPlaceholder: { type: String, default: 'Search for restaurants, hotels, services...' }
    },
    stats: [{
        label: { type: String },
        value: { type: String },
        icon: { type: String } // e.g., 'MapPin', 'Users'
    }],
    featuredCategories: [{
        name: { type: String },
        image: { type: String },
        count: { type: String },
        link: { type: String }
    }],
    cta: {
        title: { type: String, default: 'Grow Your Business with ShweReview' },
        subtitle: { type: String, default: 'Claim your business profile, respond to reviews, and reach thousands of potential customers.' },
        buttonText: { type: String, default: 'List Your Business' },
        link: { type: String, default: '/business/new' }
    }
}, { timestamps: true });

// Prevent overwrite on hot reload
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const ReviewVote = mongoose.models.ReviewVote || mongoose.model('ReviewVote', ReviewVoteSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const HomepageConfig = mongoose.models.HomepageConfig || mongoose.model('HomepageConfig', HomepageConfigSchema);

export { User, Business, Review, ReviewVote, Report, Notification, HomepageConfig };
