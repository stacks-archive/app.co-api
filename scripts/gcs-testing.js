require('dotenv').config();

const { uploadFromURL } = require('../common/lib/gcloud');

const testingURL =
  'https://lh3.googleusercontent.com/-9Ikr2fdDh0auDJOX9qorPln1CIwu8cpeBJqyz9S1blUelrl_50wsNlGDq3KVV5hdeoPgt1Z2NTtnO2NqP3Xci65U51opoPA5eVvp2SC2tDkQJKJjigTE8GXbIM_gcQAsEriOix_Rw=w390-h315-p-k';

const testUpload = async () => {
  const file = await uploadFromURL(testingURL);
  console.log(file);
};

testUpload();
