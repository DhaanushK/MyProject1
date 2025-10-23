import mongoose from 'mongoose';
import EmailLog from '../src/models/EmailLog.js';

mongoose.connect('mongodb://localhost:27017/finalyear')
  .then(() => {
    const testEmail = new EmailLog({
      type: 'report',
      subject: 'Test Email',
      recipients: [{
        email: 'kanishkka0208@gmail.com',
        name: 'Kanishkka',
        status: 'sent'
      }],
      content: {
        text: 'Test content',
        html: '<p>Test content</p>'
      },
      priority: 'normal',
      sender: {
        email: 'dhaanushk1110@gmail.com',
        name: 'Dhaanush'
      }
    });

    return testEmail.save();
  })
  .then(doc => {
    console.log('Test email created:', JSON.stringify(doc, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });