// Test file to verify module resolution
import AthleteSignup from '../../components/auth/AthleteSignup';
console.log('AthleteSignup component:', AthleteSignup);

// Also try with relative import
import AthleteSignupRelative from '../components/auth/AthleteSignup';
console.log('AthleteSignup component (relative):', AthleteSignupRelative); 