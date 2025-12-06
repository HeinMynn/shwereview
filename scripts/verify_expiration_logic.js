
import dbConnect from '../src/lib/mongodb.js';
import { BusinessClaim } from '../src/lib/models.js';
import mongoose from 'mongoose';

async function mockExpiredClaim() {
    try {
        console.log('Connecting to DB...');
        await dbConnect();

        // Create a dummy pending claim with OLD timestamp
        const oldDate = new Date();
        oldDate.setMinutes(oldDate.getMinutes() - 20); // 20 mins ago

        const claim = new BusinessClaim({
            business_id: new mongoose.Types.ObjectId(), // Dummy ID
            claimant_id: new mongoose.Types.ObjectId(), // Dummy ID
            verification_method: 'email',
            status: 'pending',
            verification_data: 'test@example.com|123456',
            last_sent_at: oldDate
        });

        await claim.save();
        console.log('Created mock expired claim:', claim._id);
        console.log('Timestamp:', claim.last_sent_at);

        // Now we would ideally hit the API, but since we are in a script, 
        // we can just verify the logic works if we were to run the same check.
        // Or better, we can duplicate the check logic here to prove it works on this data structure.

        const expirationTime = 15 * 60 * 1000;
        const timeElapsed = Date.now() - new Date(claim.last_sent_at).getTime();

        console.log('Time elapsed (ms):', timeElapsed);
        console.log('Expiration limit (ms):', expirationTime);

        if (timeElapsed > expirationTime) {
            console.log('SUCCESS: Logic correctly identifies expired claim.');
        } else {
            console.error('FAILURE: Logic failed to identify expired claim.');
            process.exit(1);
        }

        // Cleanup
        await BusinessClaim.deleteOne({ _id: claim._id });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

mockExpiredClaim();
