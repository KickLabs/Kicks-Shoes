const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Privacy Policy</h1>
      <p>
        Your privacy is important to us. This Privacy Policy explains how we collect, use, and
        protect your personal information when you use our application.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Personal data from Facebook/Google login (name, email, avatar)</li>
        <li>Data you provide during usage (preferences, activities)</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To provide access to features</li>
        <li>To personalize your experience</li>
        <li>To improve our services</li>
      </ul>

      <h2>Third-Party Access</h2>
      <p>
        We do not share your data with any third party except Facebook/Google used for
        authentication.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain user data for as long as the account is active. You may request deletion anytime.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at:{' '}
        <strong>kickslabss@gmail.com</strong>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
